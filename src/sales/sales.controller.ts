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
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { DateRangeDto } from './dto/date-range.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';

@Controller('sales')
export class SalesController {
    constructor(private salesService: SalesService) { }

    @Get()
    findAll() {
        return this.salesService.findAll();
    }

    @UseGuards(AuthGuard)
    @Post()
    create(@Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(createSaleDto);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.salesService.findById(id);
    }

    @Get('user/:userId')
    async findByUserId(@Param('userId') userId: string) {
        return this.salesService.findByUserId(userId);
    }

    @Get('pdf/:id')
    async generatePdf(@Param('id') id: string) {
        return this.salesService.generatePdf(id);
    }
    
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'employee')
    @Get('date-range')
    async findByDateRange(@Query() query: DateRangeDto) {
        return this.salesService.findByDateRange(query.startDate, query.endDate);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'employee')
    @Patch('return/:id')
    async returnSale(
        @Param('id') id: string,
        @Body() updateSaleDto: UpdateSaleDto,
    ) {
        return await this.salesService.returnSale(id, updateSaleDto);
    }

}
