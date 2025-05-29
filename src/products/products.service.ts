import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Image, ImagesDto } from './dto/images.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

import { v4 as uuid } from 'uuid';
import { subMonths, startOfWeek, endOfWeek } from 'date-fns';

type UploadedFile = {
  filename: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  private async validateProduct(product: any, ProductTag: any) {
    const category = await this.prisma.category.findUnique({
      where: { id: product.categoryId },
    });
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: product.supplierId },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }
    if (category.status === 'INACTIVE') {
      throw new NotFoundException('Categoria inactiva');
    }

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    if (supplier.status === 'INACTIVE') {
      throw new NotFoundException('Proveedor inactivo');
    }

    if (product.price <= 0) {
      throw new BadRequestException('El precio no puede ser negativo');
    }

    if (product.barcode) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          barcode: product.barcode,
          // Opcional: excluir el producto actual si estás actualizando
          ...(product.id && { id: { not: product.id } }),
        },
      });

      if (existingProduct) {
        throw new BadRequestException('El código de barras ya está registrado');
      }
    }

    if (ProductTag) {
      for (const tag of ProductTag) {
        const tagFound = await this.prisma.tag.findUnique({
          where: { id: tag },
        });
        if (!tagFound) {
          throw new NotFoundException('Etiqueta no encontrada');
        }
      }
    }
  }

  private async uploadImagesProduct(product: any, files: UploadedFile[]) {
    const allowedFileTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];
    const maxFileSize = 5 * 1024 * 1024;
    const maxFiles = 3;
    let imageUrls: string[] = [];

    if (files) {
      if (files.length > maxFiles) {
        throw new BadRequestException(
          'Se han subido demasiados archivos (máximo 3)',
        );
      }

      for (const file of files) {
        if (!allowedFileTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            'Tipo de archivo no permitido (solo jpeg, png, jpg y webp)',
          );
        }
        if (file.size > maxFileSize) {
          throw new BadRequestException(
            'El tamaño del archivo es demasiado grande (máximo 5MB)',
          );
        }
      }

      const uploadedImages = await Promise.all(
        files.map((file) =>
          this.cloudinaryService.uploadFile({
            filename: `${product.name}_${product.categoryId}_${uuid()}`,
            buffer: file.buffer,
            mimetype: file.mimetype,
            size: file.size,
          } as Express.Multer.File),
        ),
      );

      imageUrls = uploadedImages.map((img) => img.secure_url);
    }

    return imageUrls;
  }

  async create(createProductDto: CreateProductDto, files: UploadedFile[]) {
    try {
      const { ProductTag, ...product } = createProductDto;

      await this.validateProduct(product, ProductTag);

      const imageUrls = await this.uploadImagesProduct(product, files);

      return await this.prisma.product.create({
        data: {
          ...product,
          ProductTag: {
            create:
              ProductTag?.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })) || [],
          },
          images: {
            create: imageUrls?.map((url) => ({ url })),
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        ProductTag: {
          select: {
            tag: true,
          },
        },
        images: {
          select: {
            url: true,
          },
        },
      },
    });
  }

  async findAllForSale() {
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        category: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
        batches: {
          where: {
            isExpired: false,
          },
          select: {
            available_amount: true,
          },
        },
      },
      where: {
        status: 'ACTIVE',
      },
    });

    return products.map((product) => {
      const totalAmount = product.batches.reduce(
        (total, batch) => total + batch.available_amount,
        0,
      );

      return {
        id: product.id,
        name: product.name,
        category: product.category.name,
        supplier: product.supplier.name,
        price: product.price,
        totalAmount,
      };
    });
  }

  async findByNameOrId(query?: string) {
    if (!query) {
      return await this.prisma.product.findMany();
    }
    return await this.prisma.product.findMany({
      where: {
        OR: [{ name: { contains: query, mode: 'insensitive' } }, { id: query }],
      },
      include: {
        category: true,
        ProductTag: {
          include: {
            tag: true,
          },
        },
        images: {
          select: {
            url: true,
          },
        },
      },
    });
  }

  async findByNameOnly(query: string) {
    if (!query) {
      return await this.findAll();
    }
    return await this.prisma.product.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      include: {
        category: true,
        ProductTag: {
          include: {
            tag: true,
          },
        },
        images: {
          select: {
            url: true,
          },
        },
      },
    });
  }

  async getWeeklySalesLast6Months(id: string) {
    try {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);

      // Verificar si el producto existe
      const productExists = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!productExists) {
        throw new NotFoundException('Producto no encontrado');
      }

      // Obtiene todas las ventas del producto en los últimos 6 meses
      const sales = await this.prisma.saleProductClient.findMany({
        where: {
          productId: id,
          venta: {
            date: {
              gte: sixMonthsAgo,
            },
            repaid: false, // Asegura que no se incluyan ventas reembolsadas
          },
        },
        select: {
          amount: true,
          venta: {
            select: {
              date: true,
            },
          },
        },
      });

      // Agrupa por semana usando un Map
      const weeksMap = new Map<string, number>();

      for (const sale of sales) {
        const saleDate = new Date(sale.venta.date);
        const start = startOfWeek(saleDate, { weekStartsOn: 1 }); // lunes como inicio de semana
        const weekKey = start.toISOString().split('T')[0]; // ej. '2025-03-10'

        const prevCount = weeksMap.get(weekKey) || 0;
        weeksMap.set(weekKey, prevCount + sale.amount);
      }

      // Asegura que estén las 24 semanas (incluso si no hubo ventas)
      const result: { week: string; totalSales: number }[] = [];
      for (let i = 0; i < 24; i++) {
        const weekStart = startOfWeek(subMonths(now, 3), { weekStartsOn: 1 });
        const currentWeekStart = new Date(
          weekStart.getTime() + i * 7 * 24 * 60 * 60 * 1000,
        );
        const key = currentWeekStart.toISOString().split('T')[0];
        result.push({
          week: key,
          totalSales: weeksMap.get(key) || 0,
        });
      }

      return result;
    } catch (error) {
      throw new BadRequestException('Error al obtener las ventas semanales');
    }
  }

  async getProductStockSummary() {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          batches: {
            some: {
              status: 'ACTIVE',
              isExpired: false,
            },
          },
        },
        select: {
          id: true,
          name: true,
          batches: {
            where: {
              status: 'ACTIVE',
              isExpired: false,
            },
            select: {
              available_amount: true,
            },
          },
        },
      });

      const result = products.map((product) => {
        const stock = product.batches.reduce(
          (total, batch) => total + batch.available_amount,
          0,
        );

        return {
          id: product.id,
          name: product.name,
          stock,
        };
      });

      return result;
    } catch (error) {
      throw new BadRequestException('Error al obtener el stock por producto');
    }
  }

  async findFilteredProducts(
    categories?: string[],
    suppliers?: string[],
    tags?: string[],
    minPrice?: number,
    maxPrice?: number,
    query?: string,
  ) {
    const filters: any = {
      status: 'ACTIVE',
    };

    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.price = {};
      if (minPrice !== undefined) filters.price.gte = minPrice;
      if (maxPrice !== undefined) filters.price.lte = maxPrice;
    }

    if (categories && categories.length > 0) {
      filters.category = {
        name: {
          in: categories,
          mode: 'insensitive',
        },
      };
    }

    if (suppliers && suppliers.length > 0) {
      filters.supplier = {
        name: {
          in: suppliers,
          mode: 'insensitive',
        },
      };
    }

    if (tags && tags.length > 0) {
      filters.ProductTag = {
        some: {
          tag: {
            name: {
              in: tags,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    if (query) {
      filters.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          ProductTag: {
            some: {
              tag: {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ];
    }

    return this.prisma.product.findMany({
      where: filters,
      include: {
        category: true,
        ProductTag: {
          select: {
            tag: true,
          },
        },
        images: {
          select: {
            url: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files: UploadedFile[],
    images: ImagesDto,
  ) {
    try {
      const { ProductTag, ...product } = updateProductDto;

      await this.validateProduct({ ...product, id }, ProductTag);

      const newImageUrls = await this.uploadImagesProduct(product, files);

      const productFound = await this.prisma.product.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!productFound) {
        throw new NotFoundException('Producto no encontrado');
      }

      const urlsToKeep = images.images
        .filter((img) => img.isExisting)
        .map((img) => img.data_url);

      const imagesToDelete = productFound.images.filter(
        (img) => !urlsToKeep.includes(img.url),
      );

      await this.prisma.productImage.deleteMany({
        where: {
          id: {
            in: imagesToDelete.map((img) => img.id),
          },
        },
      });

      const productImageCreates = newImageUrls.map((url) => ({
        url,
        productId: id,
      }));

      if (productImageCreates.length > 0) {
        await this.prisma.productImage.createMany({
          data: productImageCreates,
        });
      }

      return await this.prisma.product.update({
        where: { id },
        data: {
          ...product,
          ProductTag: {
            deleteMany: {},
            create:
              ProductTag?.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })) || [],
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } });

      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      return await this.prisma.product.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
    } catch (error) {
      throw error;
    }
  }
}
