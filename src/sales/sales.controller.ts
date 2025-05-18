import { Controller, Post, Body, Get } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';


@Controller('sales')
export class SalesController {

    constructor(private readonly salesService: SalesService) {}

    @Get()
    findAll() {
        console.log('findAll');
    }
    @Post()
    create(@Body() createSaleDto: CreateSaleDto) {
        this.salesService.create(createSaleDto);
    }
}
