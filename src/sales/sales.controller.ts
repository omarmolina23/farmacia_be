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
import { DateRangeDto } from './dto/date-range.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';

@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.salesService.findById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Get()
  async findByDateRange(@Query() query: DateRangeDto) {
    return this.salesService.findByDateRange(query.startDate, query.endDate);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Patch('return/:id')
  async returnSale(@Param('id') id: string) {
    await this.salesService.returnSale(id);
  }
}
