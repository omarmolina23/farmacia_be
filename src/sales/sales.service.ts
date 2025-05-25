import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { InvoiceService } from 'src/invoice/invoice.service';
import { MailerService } from '@nestjs-modules/mailer';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Decimal } from '@prisma/client/runtime/library';
import * as path from 'path';
import * as fs from 'fs/promises';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
    constructor(
        private prisma: PrismaService,
        private invoiceService: InvoiceService,
        private mailerService: MailerService,
        private cloudinaryService: CloudinaryService,
    ) { }

    async create(createSaleDto: CreateSaleDto) {
        try {
            const { products, ...rest } = createSaleDto;

            // Aquí guardaremos los productos con precios y subtotales
            const detailedProducts: {
                name: string;
                quantity: number;
                unitPrice: number;
                subtotal: number;
            }[] = [];

            //Guardar cliente
            const clientFound: {
                id: string;
                name: string,
                email: string;
            }[] = [];

            var saleFinal;

            // Transacción para asegurar consistencia
            await this.prisma.$transaction(async (tx) => {
                // Calcular total desde la base de datos
                let total = 0;

                for (const { productId, amount } of products) {
                    const product = await tx.product.findUnique({
                        where: { id: productId },
                        select: { price: true, name: true },
                    });

                    if (!product) {
                        throw new Error(`Producto con ID ${productId} no encontrado.`);
                    }

                    total += Number(product.price) * amount;

                    const subtotal = Number(product.price) * amount;


                    detailedProducts.push({
                        name: product.name,
                        quantity: amount,
                        unitPrice: Number(product.price),
                        subtotal,
                    });
                }

                //const qrImageUrl = await this.cloudinaryService.uploadFileBase64(qr_image, `qr_${rest.clientId}_${crypto.randomUUID()}`);
                // Crear la venta con total calculado
                const sale = await tx.sale.create({
                    data: {
                        ...rest,
                        total: new Decimal(total),
                        repaid: false
                    },
                });

                // Procesar cada producto en la venta
                for (const product of products) {
                    const { productId, amount } = product;
                    let remaining = amount;

                    // Obtener lotes válidos para este producto
                    const batches = await tx.batch.findMany({
                        where: {
                            productId,
                            isExpired: false,
                            expirationDate: { gt: new Date() },
                            available_amount: { gt: 0 },
                        },
                        orderBy: {
                            entryDate: 'asc',
                        },
                    });

                    if (!batches.length) {
                        throw new Error(`No hay lotes disponibles para el producto ${productId}`);
                    }

                    // Crear relación SaleProductClient
                    const saleProduct = await tx.saleProductClient.create({
                        data: {
                            productId,
                            saleId: sale.id,
                            amount,
                        },
                    });

                    // Descontar stock lote por lote
                    for (const batch of batches) {
                        if (remaining <= 0) break;

                        const toDeduct = Math.min(batch.available_amount, remaining);

                        // Actualizar lote
                        await tx.batch.update({
                            where: { id: batch.id },
                            data: {
                                available_amount: {
                                    decrement: toDeduct,
                                },
                            },
                        });

                        // Crear relación SaleBatch
                        await tx.saleBatch.create({
                            data: {
                                saleProductId: saleProduct.id,
                                batchId: batch.id,
                                quantity: toDeduct,
                            },
                        });

                        remaining -= toDeduct;
                    }

                    if (remaining > 0) {
                        throw new Error(`Stock insuficiente para el producto ${productId}. Faltan ${remaining} unidades.`);
                    }

                    const client = await tx.client.findUnique({
                        where: { id: rest.clientId },
                        select: { id: true, name: true, email: true },
                    });

                    if (!client) {
                        throw new Error(`Cliente con ID ${rest.clientId} no encontrado.`);
                    }

                    clientFound.push({
                        id: client.id,
                        name: client.name,
                        email: client.email,
                    });
                }

                saleFinal = sale;

            });

            // Generar PDF de la factura
            const pdf_sale = await this.invoiceService.generateInvoicePdf(
                {
                    sale: saleFinal,
                    clientFound: clientFound,
                    detailedProducts: detailedProducts,
                }
            );

            // Enviar correo al primer cliente (asumiendo uno por venta)
            await this.mailerService.sendMail({
                to: clientFound[0].email,
                subject: `Factura de tu compra - Venta #${saleFinal.id}`,
                html: `<p>Hola ${clientFound[0].name},</p>
                    <p>Gracias por tu compra. Adjuntamos la factura correspondiente a tu venta #${saleFinal.id}.</p>
                    <p>¡Gracias por elegirnos!</p>`,
                attachments: [
                    {
                        filename: `factura-${saleFinal.id}.pdf`,
                        content: pdf_sale,
                        contentType: 'application/pdf',
                    },
                ],
            });

            return {
                ...saleFinal,
                message: 'Venta creada exitosamente',
            };
        } catch (error) {
            throw error;
        }
    }

    async findAll() {
        return await this.prisma.sale.findMany({
            include: {
                client: true,
                products: {
                    include: {
                        products: {
                            include: {
                                category: true,
                                supplier: true,
                            }
                        }
                    }
                },
            },
        });
    }
  
  private readonly saleInclude = {
    client: true,
    products: {
      include: {
        products: {
          include: {
            category: true,
            supplier: true,
          }
        },
        SaleBatch: true, // Include SaleBatch relation
      }
    },
  };

  async findById(id: string) {

    try{
      await this.validateSale(id);

    return this.prisma.sale.findUnique({
      where: { id },
      include: this.saleInclude,
    });
    }
    catch (error) {
      throw error;
    }
    
  }

  async findByUserId(userId: string) {
    try{
      return this.prisma.sale.findMany({
      where: { clientId: userId },
      include: this.saleInclude,
    });
    }
    catch (error) {
      throw error;
    }
    
  }

  async generateEInvoice(id: string, updateSaleDto: UpdateSaleDto){
    try {
      const { bill_id, number_e_invoice, cufe, qr_image } = updateSaleDto;
      const sale = await this.findById(id);

      console.log("Hola")

      const updatedSale = await this.prisma.sale.update({
        where: { id },
        data: {
          bill_id,
          number_e_invoice,
          cufe,
          qr_image,
        },
        include: this.saleInclude,
      });

      if (!sale) {
        throw new NotFoundException('Venta no encontrada');
      }

      const pdf_sale = await this.invoiceService.generateInvoicePdf({
        sale: updatedSale,
        clientFound: [
          {
            id: sale.client.id,
            name: sale.client.name,
            email: sale.client.email,
          }
        ],
        detailedProducts: sale.products.map((product) => ({
          name: product.products.name,
          quantity: product.amount,
          unitPrice: Number(product.products.price),
          subtotal: product.amount * Number(product.products.price),
        })),
      });

      await this.mailerService.sendMail({
        to: sale.client.email,
        subject: `Factura de tu compra - Venta #${updatedSale.id}`,
        html: `<p>Hola ${sale.client.name},</p>
            <p>Gracias por tu compra. Adjuntamos la factura correspondiente a tu venta #${updatedSale.id}.</p>
            <p>¡Gracias por elegirnos!</p>`,
        attachments: [
          {
            filename: `factura-${updatedSale.id}.pdf`,
            content: pdf_sale,
            contentType: 'application/pdf',
          },
        ],
      });

      return updatedSale;
    } catch (error) {
      throw error;
    }
  }

  async generatePdf(id: string) {
    try{
      await this.validateSale(id, true);
      const sale = await this.prisma.sale.findUnique({
        where: { id },
        include: this.saleInclude,
      });

      const detailedProducts: {
        name: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }[] = [];

      const clientFound: {
        id: string;
        name: string,
        email: string;
      }[] = [];

      
      if(sale){
        sale.products.forEach(product => {
          detailedProducts.push({
            name: product.products.name,
            quantity: product.amount,
            unitPrice: Number(product.products.price),
            subtotal: product.amount * Number(product.products.price),
          });
        });
        clientFound.push({
          id: sale.client.id,
          name: sale.client.name,
          email: sale.client.email,
        });
      }

      const response = await this.invoiceService.generateInvoicePdf({
        sale: sale,
        clientFound: clientFound,
        detailedProducts: detailedProducts
      });
      
      return response;
    }
    catch (error) {
      throw error;
    }
  }

  async findByDateRange(startDate: Date, endDate: Date, repaid?: boolean) {
    const adjustedEndDate = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    if(repaid === undefined) { 
      repaid = false;
    }
    
    console.log(repaid);

    return this.prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: adjustedEndDate,
        },
        repaid: repaid,
      },
      include: this.saleInclude,
      orderBy: {
        date: 'asc',
      },
    });
  }

  async returnSale(id: string, updateSaleDto: UpdateSaleDto) {
    try {
      const { number_credit_note } = updateSaleDto;
      const sale = await this.findById(id);
      if (sale) {
        for (const product of sale.products) {
          for (const saleBatch of product.SaleBatch) {
            const batch = await this.prisma.batch.findUnique({
              where: { id: saleBatch.batchId },
            });

            if (!batch) {
              throw new NotFoundException(
                `Lote con ID ${saleBatch.batchId} no encontrado`,
              );
            }

            if (batch.available_amount === 0 && batch.status === 'INACTIVE') {
              await this.prisma.batch.update({
                where: { id: saleBatch.batchId },
                data: {
                  status:'ACTIVE',
                },
              });
            }

            await this.prisma.batch.update({
              where: { id: saleBatch.batchId },
              data: {
                available_amount:
                  Number(batch.available_amount) + Number(saleBatch.quantity),
              },
            });
          }
        }

        const updateSale = await this.prisma.sale.update({
          where: { id },
          data: {
            repaid: true,
            number_credit_note: number_credit_note,
          },
          include: this.saleInclude,
        });

        return updateSale;
      }
    } catch (error) {
      throw error;
    }
  }

  private async validateSale(saleId: string, onlyFound: boolean = false) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.repaid && !onlyFound)
      throw new NotFoundException('Venta devolutiva ya realizada');
    return sale;
  }

}
