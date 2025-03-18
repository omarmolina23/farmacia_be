import { Body, Res, Query, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { SetPasswordUserDto } from 'src/users/dto/set-password-user.dto';
import { ForgotPasswordDto } from 'src/users/dto/forgot-password.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { Roles } from './guard/roles.decorator';
import { FastifyReply } from 'fastify';


@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(
        @Body() loginUserDto: LoginUserDto,
        @Res() response: FastifyReply
    ) {
        return this.authService.login(loginUserDto, response);
    }

    @Post('sign-up')
    register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Post('sign-out')
    signOut(
        @Res() response: FastifyReply
    ) {
        return this.authService.signOut(response);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Post('set-password')
    setPassword(
        @Query('token') token: string,
        @Body() setPasswordUserDto: SetPasswordUserDto
    ) {
        return this.authService.setPassword(token, setPasswordUserDto);
    }

    @Post('forgot-password')
    forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('refresh-token')
    refreshToken(@Query('refreshToken') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }
}
