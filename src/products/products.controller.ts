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
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';

@Controller('product')
export class ProductsController {
    constructor(private productsService: ProductsService) {}

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get('search')
    findByNameOrId(@Query('query') query?: string) {
        return this.productsService.findByNameOrId(query);
    }
}
