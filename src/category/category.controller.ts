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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create.category';
import { UpdateCategoryDto } from './dto/update.category';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/validators/roles.decorator';

@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('search')
  search(@Query('query') query?: string) {
    return this.categoryService.findByName(query);
  }

  @Get('sales-category')
  async getSalesCategory() {
    return await this.categoryService.getSalesByCategoryWeekly();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
