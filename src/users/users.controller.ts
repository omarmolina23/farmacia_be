import { Controller, Body, Query, Param, Get, UseGuards, Patch, UsePipes, ValidationPipe, Delete } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/guard/roles.decorator';

@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('all')
    findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('search')
    search(
        @Query('query') query?: string,
    ) {
        return this.usersService.findOneByNameOrId(query);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }



}
