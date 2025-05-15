import {Module} from '@nestjs/common';
import { ScanGateway } from './scan.gateway';

@Module({
    providers: [ScanGateway],
})
export class SalesModule {}