import {Module} from '@nestjs/common';
import { ScanGateway } from './scan.gateway';
import { SalesService } from './sales.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { SalesController } from './sales.controller';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { BrevoModule } from 'src/brevo/brevo.module';

@Module({
    imports: [InvoiceModule, BrevoModule],
    providers: [ScanGateway, SalesService, CloudinaryService],
    controllers: [SalesController],
})
export class SalesModule {}