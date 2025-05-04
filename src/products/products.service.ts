import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Image, ImagesDto } from './dto/images.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

import { v4 as uuid } from 'uuid';
import { validate } from 'class-validator';
import { TagController } from 'src/tag/tag.controller';

type UploadedFile = {
    filename: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
}




@Injectable()
export class ProductsService {

    constructor(
        private prisma: PrismaService,
        private cloudinaryService: CloudinaryService
    ) { }

    private async validateProduct(product: any, ProductTag: any) {
        const category = await this.prisma.category.findUnique({ where: { id: product.categoryId } });
        const supplier = await this.prisma.supplier.findUnique({ where: { id: product.supplierId } });

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

        if (ProductTag) {
            for (const tag of ProductTag) {
                const tagFound = await this.prisma.tag.findUnique({ where: { id: tag } });
                if (!tagFound) {
                    throw new NotFoundException('Etiqueta no encontrada');
                }
            }
        }
    }

    private async uploadImagesProduct(product: any, files: UploadedFile[]) {
        const allowedFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        const maxFileSize = 5 * 1024 * 1024;
        const maxFiles = 3;
        let imageUrls: string[] = [];

        if (files) {
            if (files.length > maxFiles) {
                throw new BadRequestException('Se han subido demasiados archivos (máximo 3)');
            }

            for (const file of files) {
                if (!allowedFileTypes.includes(file.mimetype)) {
                    throw new BadRequestException('Tipo de archivo no permitido (solo jpeg, png, jpg y webp)');
                }
                if (file.size > maxFileSize) {
                    throw new BadRequestException('El tamaño del archivo es demasiado grande (máximo 5MB)');
                }
            }

            const uploadedImages = await Promise.all(
                files.map(file =>
                    this.cloudinaryService.uploadFile({
                        filename: `${product.name}_${product.categoryId}_${uuid()}`,
                        buffer: file.buffer,
                        mimetype: file.mimetype,
                        size: file.size,
                    } as Express.Multer.File)
                )
            );

            imageUrls = uploadedImages.map(img => img.secure_url);
        }

        return imageUrls;
    }

    async create(createProductDto: CreateProductDto, files: UploadedFile[]) {
        try {

            const { ProductTag, ...product } = createProductDto;

            this.validateProduct(product, ProductTag);

            const imageUrls = await this.uploadImagesProduct(product, files);


            return await this.prisma.product.create({
                data: {
                    ...product,
                    ProductTag: {
                        create: ProductTag?.map((tagId) => ({ tag: { connect: { id: tagId } } })) || [],
                    },
                    images: {
                        create: imageUrls?.map((url) => ({ url })),
                    },
                }
            });
        }
        catch (error) {
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
                }
            },
        });
    }


    async findByNameOrId(query?: string) {
        if (!query) {
            return await this.prisma.product.findMany();
        }
        return await this.prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { id: query },
                ],
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
                }
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
                }
            },
        });
    }

    async findFilteredProducts(
        category?: string,
        tag?: string[],
        supplier?: string,
        minPrice?: number,
        maxPrice?: number,
        name?: string, // <--- nuevo parámetro
    ) {
        try {
            const filters: any = {
                status: 'ACTIVE',
            };

            if (minPrice !== undefined || maxPrice !== undefined) {
                filters.price = {};
                if (minPrice !== undefined) filters.price.gte = minPrice;
                if (maxPrice !== undefined) filters.price.lte = maxPrice;
            }

            if (category) {
                filters.category = {
                    name: {
                        contains: category,
                        mode: 'insensitive',
                    },
                };
            }

            if (tag && tag.length > 0) {
                filters.ProductTag = {
                    some: {
                        tag: {
                            name: {
                                in: tag,
                            },
                        },
                    },
                };
            }

            if (supplier) {
                filters.supplier = {
                    name: {
                        contains: supplier,
                        mode: 'insensitive',
                    },
                };
            }
            

            if (name) {
                filters.name = {
                    contains: name,
                    mode: 'insensitive',
                };
            }

            return await this.prisma.product.findMany({
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
        } catch (error) {
            throw error;
        }
    }

    async update(id: string, updateProductDto: UpdateProductDto, files: UploadedFile[], images: ImagesDto) {
        try {

            const { ProductTag, ...product } = updateProductDto;

            this.validateProduct(product, ProductTag);

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
                img => !urlsToKeep.includes(img.url)
            )

            await this.prisma.productImage.deleteMany({
                where: {
                    id: {
                        in: imagesToDelete.map(img => img.id),
                    },
                },
            })

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
                        create: ProductTag?.map((tagId) => ({
                            tag: { connect: { id: tagId } }
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
            })
        } catch (error) {
            throw error;
        }
    }

}