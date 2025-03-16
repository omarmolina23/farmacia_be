import { Body, Query, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { SetPasswordUserDto } from 'src/users/dto/set-password-user.dto';
import { AuthService } from './auth.service';


@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Post('signup')
    register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Post('set-password')
    setPassword(
        @Query('token') token: string,
        @Body() setPasswordUserDto: SetPasswordUserDto
    ){
        console.log(token);
        return this.authService.setPassword(token, setPasswordUserDto);
    }
}
