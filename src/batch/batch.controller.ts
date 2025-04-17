import{
    Controller,
    Get,
    Post,
    Body,
    Query,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';

@Controller('batch')
export class BatchController {
    constructor(private batchService: BatchService) { }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    create(@Body() createBatchDto: CreateBatchDto) {
        return this.batchService.create(createBatchDto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    findAll() {
        return this.batchService.findAll();
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('search')
    findByNumberBatch(@Query('query') query: string) {
        return this.batchService.findByNumberBatch(query);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('search/id')
    findById(@Query('query') query: string) {
        return this.batchService.findById(query);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBatchDto: UpdateBatchDto) {
        return this.batchService.update(id, updateBatchDto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.batchService.remove(id);
    }

}
