import {Module} from '@nestjs/common';
import { ScanGateway } from './scan.gateway';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { InvoiceModule } from 'src/invoice/invoice.module';

@Module({
    imports: [InvoiceModule], // Importa el módulo de Invoice
    providers: [ScanGateway, SalesService],
    controllers: [SalesController],
})
export class SalesModule {}