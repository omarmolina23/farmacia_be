import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './category/category.module';
import { SupplierModule } from './supplier/supplier.module';
import { ProductsModule } from './products/products.module';
import { BatchModule } from './batch/batch.module';
import { TagModule } from './tag/tag.module';
import { ClientModule } from './client/client.module';
import { SalesModule } from './sales/sales.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [AuthModule, UsersModule, CategoryModule, SupplierModule, ProductsModule, BatchModule, TagModule, ClientModule, SalesModule, CloudinaryModule, ScheduleModule.forRoot(), DashboardModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
