import{
    Controller,
    Get,
    Post,
    Body,
    Query,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';

@Controller('product')
export class ProductsController {
    constructor(private productsService: ProductsService) {}

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
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
