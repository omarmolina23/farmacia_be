import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './category/category.module';
import { SupplierModule } from './supplier/supplier.module';

@Module({
  imports: [AuthModule, UsersModule, CategoryModule, SupplierModule],
})
export class AppModule {}
