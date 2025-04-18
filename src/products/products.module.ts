import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from 'prisma/prisma.module';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService]
})
export class ProductsModule {}