import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './category/category.module';
import { SupplierModule } from './supplier/supplier.module';
import { ProductsModule } from './products/products.module';
import { BatchModule } from './batch/batch.module';
import { TagModule } from './tag/tag.module';

@Module({
  imports: [AuthModule, UsersModule, CategoryModule, SupplierModule, ProductsModule, BatchModule, TagModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
