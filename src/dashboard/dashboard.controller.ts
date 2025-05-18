import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('daily-status')
  async getDailyStatus() {
    return await this.dashboardService.getDailyStatus();
  }

  @Get('recent-sales')
  async getRecentSales() {
    return await this.dashboardService.getRecentSales();
  }

  @Get('products-sold')
  async getProductsSold() {
    return await this.dashboardService.getProductsSold();
  }

  @Get('minimum-stock')
  async getMinimumStock() {
    return await this.dashboardService.getMinimumStockByMonth();
  }

  @Get('sales-category')
  async getSalesCategory() {
    return await this.dashboardService.getSalesByCategoryWeekly();
  }

  @Get('profit-category')
  async getProfitCategory() {
    return await this.dashboardService.getProfitCategory();
  }

}
