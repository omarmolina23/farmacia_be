import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
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
        return this.salesService.findAll();
    }

    @UseGuards(AuthGuard)
    @Post()
    create(@Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(createSaleDto);
    }
}
