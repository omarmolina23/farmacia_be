import {Module} from '@nestjs/common';
import { ScanGateway } from './scan.gateway';
import { SalesService } from './sales.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { SalesController } from './sales.controller';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { SendGridModule } from 'src/sendgrid/sendgrid.module';

@Module({
    imports: [InvoiceModule, SendGridModule], // Importa el módulo de Invoice
    providers: [ScanGateway, SalesService, CloudinaryService],
    controllers: [SalesController],
})
export class SalesModule {}