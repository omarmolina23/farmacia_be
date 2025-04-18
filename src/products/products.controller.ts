import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    UploadedFiles,
    Req,
    UsePipes,
    ValidationPipe,
    BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';
import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { ApiConsumes } from '@nestjs/swagger';
import { ApiFileBody, MulterFile } from '@webundsoehne/nest-fastify-file-upload';
import { FastifyRequest } from 'fastify';
import { validate } from 'class-validator';




@Controller('product')
export class ProductsController {
    constructor(private productsService: ProductsService) { }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    create(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() createProductDto: CreateProductDto
    ) {
        return this.productsService.create(createProductDto, files);
    }

    @Post('upload')
    @UsePipes(new ValidationPipe({ transform: true }))
    async createProduct(@Req() req: FastifyRequest) {
        const parts = req.parts();

        const files: { filename: string; buffer: Buffer, mimetype: string, size: number }[] = [];
        const body = {};

        for await (const part of parts) {
            if (part.type === 'file') {
                const buffer = await part.toBuffer();
                files.push({
                    filename: part.filename,
                    buffer,
                    mimetype: part.mimetype,
                    size: buffer.length,
                });
            } else {
                body[part.fieldname] = part.value;
            }
        }

        // Aquí tú decides si haces validaciones o lo transformas a un DTO
        const createProductDto = new CreateProductDto();

        createProductDto.name = body['name'];
        createProductDto.description = body['description'];
        createProductDto.price = parseFloat(body['price']);
        createProductDto.categoryId = body['categoryId'];
        createProductDto.concentration = body['concentration'];
        createProductDto.activeIngredient = body['activeIngredient'];
        createProductDto.weight = body['weight'];
        createProductDto.volume = body['volume'];

        if (body['ProductTag']) {
            try {
              body['ProductTag'] = JSON.parse(body['ProductTag']);
              createProductDto.ProductTag = body['ProductTag'];
            } catch {
              throw new BadRequestException('ProductTag must be a valid JSON array');
            }
        }

        const errors = await validate(createProductDto);
        if (errors.length > 0) {
            const messages = errors.flatMap(error =>
              error.constraints ? Object.values(error.constraints) : []
            );
        
            throw new BadRequestException(messages);
        }

        return this.productsService.create(createProductDto, files);
    }



    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('search')
    findByNameOrId(@Query('query') query?: string) {
        return this.productsService.findByNameOrId(query);
    }

    @Get('search/name')
    findByNameOnly(@Query('query') query: string) {
        return this.productsService.findByNameOnly(query);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }


}
