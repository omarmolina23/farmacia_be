import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

import { v4 as uuid } from 'uuid';

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

    async create(createProductDto: CreateProductDto, files: UploadedFile[]) {
        try {
            const { ProductTag, ...product } = createProductDto;

            const allowedFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            const maxFileSize = 5 * 1024 * 1024; 
            const maxFiles = 3;
            let imageUrls: string[] = [];

            console.log("Uploaded files", files);
            console.log("ProductTag", ProductTag);

            const category = await this.prisma.category.findUnique({ where: { id: product.categoryId } });

            if (!category) {
                throw new NotFoundException('Categoria no encontrada');
            }
            if (category.status === 'INACTIVE') {
                throw new NotFoundException('Categoria inactiva');
            }

            if(product.price <= 0) {
                throw new NotFoundException('El precio debe ser mayor a 0');
            }

            if(ProductTag){
                for (const tag of ProductTag) {
                    const tagFound = await this.prisma.tag.findUnique({ where: { id: tag } });
                    if (!tagFound) {
                        throw new NotFoundException('Etiqueta no encontrada');
                    }
                }
            }

            if(files){

                console.log("Files received:", files); // Verifica que los archivos están llegando correctamente
                if(files.length > maxFiles) {
                    throw new NotFoundException('Se han subido demasiados archivos (máximo 3)');
                }

                for(const file of files) {
                    if(!allowedFileTypes.includes(file.mimetype)) {
                        throw new NotFoundException('Tipo de archivo no permitido (solo jpeg, png, jpg y webp)');
                    }
                    if(file.size > maxFileSize) {
                        throw new NotFoundException('El tamaño del archivo es demasiado grande (máximo 5MB)');
                    }
                }

                const currentDate = new Date();
                const formattedDate = currentDate.toISOString().replace(/[-:]/g, '').split('.')[0]; // YYYYMMDD_HHMMSS

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
                ProductTag: {
                    select: {
                        tag: true,
                    },
                },
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
            },
        });
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        try {

            const {ProductTag, ...product } = updateProductDto;

            if(product.categoryId){
                const category = await this.prisma.category.findUnique({ where: { id: product.categoryId } });

                if (!category) {
                    throw new NotFoundException('Categoria no encontrada');
                }
                if (category.status === 'INACTIVE') {
                    throw new NotFoundException('Categoria inactiva');
                }
            }
            
            const productFound = await this.prisma.product.findUnique({ where: { id } });

            if (!productFound) {
                throw new NotFoundException('Producto no encontrado');
            }

            return await this.prisma.product.update({
                where: { id },
                data: {
                    ...product,
                    ProductTag: {
                        deleteMany: {}, 
                        create: ProductTag?.map((tagId) => ({ tag: { connect: { id: tagId } } })) || [],
                    },
                }
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