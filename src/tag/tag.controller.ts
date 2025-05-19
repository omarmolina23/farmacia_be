import { 
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
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';


@Controller('tags')
export class TagController {

    constructor(private readonly tagService: TagService) { }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    create(@Body() createTagDto: CreateTagDto) {
        return this.tagService.create(createTagDto);
    }
    
    @Roles('admin')
    @Get()
    findAll() {
        return this.tagService.findAll();
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateTagDto: UpdateTagDto,
    ) {
        return this.tagService.update(id, updateTagDto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tagService.remove(id);
    }


}
