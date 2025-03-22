import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './category/category.module';
import { SupplierModule } from './supplier/supplier.module';

@Module({
  imports: [UsersModule, CategoryModule, SupplierModule],
})
export class AppModule {}
