import {Module} from '@nestjs/common';
import { ScanGateway } from './scan.gateway';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

@Module({
    providers: [ScanGateway, SalesService],
    controllers: [SalesController],
})
export class SalesModule {}