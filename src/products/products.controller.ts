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
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ImagesDto } from './dto/images.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';
import { FastifyRequest } from 'fastify';
import { validate } from 'class-validator';

function extractImagesFromBody(body: Record<string, any>) {
  const images: Record<string, any>[] = [];

  for (const key in body) {
    const match = key.match(/^images\[(\d+)]\[(\w+)]$/);
    if (match) {
      const index = parseInt(match[1], 10);
      const prop = match[2];

      if (!images[index]) images[index] = {};
      images[index][prop] = body[key];
    }
  }

  return images.map((img) => ({
    data_url: img.data_url || '', // Ensure 'data_url' is included or provide a default value
    isExisting: img.isExisting === 'true',
    id: img.id || '', // Ensure 'id' is included or provide a default value
  }));
}

@Controller('product')
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createProduct(@Req() req: FastifyRequest) {
    const parts = req.parts();

    const files: {
      filename: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    }[] = [];
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

    const createProductDto = new CreateProductDto();

    createProductDto.name = body['name'];
    createProductDto.barcode = body['barcode'];
    createProductDto.description = body['description'];
    createProductDto.categoryId = body['categoryId'];
    createProductDto.supplierId = body['supplierId'];
    createProductDto.price = Number(body['price']);
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
      const messages = errors.flatMap((error) =>
        error.constraints ? Object.values(error.constraints) : [],
      );

      const errorMessage = messages.join(', ');
      throw new BadRequestException(errorMessage);
    }

    return this.productsService.create(createProductDto, files);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('for-sale')
  findAllForSale() {
    return this.productsService.findAllForSale();
  }

  @Get('filter')
  async filterProducts(
    @Query('category') category?: string,
    @Query('supplier') supplier?: string,
    @Query('tag') tag?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('query') query?: string
  ) {
    const categoryArray = category ? category.split(',') : [];
    const supplierArray = supplier ? supplier.split(',') : [];
    const tagArray = tag ? tag.split(',') : [];

    return this.productsService.findFilteredProducts(
      categoryArray,
      supplierArray,
      tagArray,
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined,
      query
    );
  }

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
  async update(@Req() req: FastifyRequest, @Param('id') id: string) {
    const parts = req.parts();

    const files: {
      filename: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    }[] = [];
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

    const updateProductDto = new UpdateProductDto();
    const imagesDto = new ImagesDto();

    updateProductDto.name = body['name'];
    updateProductDto.barcode = body['barcode'];
    updateProductDto.description = body['description'];
    updateProductDto.categoryId = body['categoryId'];
    updateProductDto.supplierId = body['supplierId'];
    updateProductDto.price = Number(body['price']) || undefined;
    updateProductDto.concentration = body['concentration'];
    updateProductDto.activeIngredient = body['activeIngredient'];
    updateProductDto.weight = body['weight'];
    updateProductDto.volume = body['volume'];

    imagesDto.images = extractImagesFromBody(body);

    if (body['ProductTag']) {
      try {
        body['ProductTag'] = JSON.parse(body['ProductTag']);
        updateProductDto.ProductTag = body['ProductTag'];
      } catch {
        throw new BadRequestException('ProductTag must be a valid JSON array');
      }
    }

    const errors = await validate(updateProductDto);

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        error.constraints ? Object.values(error.constraints) : [],
      );

      const errorMessage = messages.join(', ');
      throw new BadRequestException(errorMessage);
    }

    const images = extractImagesFromBody(body);

    return this.productsService.update(id, updateProductDto, files, imagesDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
