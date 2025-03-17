import { ConflictException, UnauthorizedException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { SetPasswordUserDto } from 'src/users/dto/set-password-user.dto';
import { ForgotPasswordDto } from 'src/users/dto/forgot-password.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { Status } from 'src/users/dto/create-user.dto';
import { FastifyReply } from 'fastify';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailerService: MailerService

    ) { }

    async login(loginUserDto: LoginUserDto, response: FastifyReply) {
        try {

            const { email, password } = loginUserDto;

            const user = await this.usersService.findOneByEmail(email);

            if (!user.password) {
                throw new BadRequestException('Password not set');
            }

            if (user.status === Status.INACTIVE) {
                throw new UnauthorizedException('User is inactive');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const token = this.jwtService.sign({ id: user.id, sub: user.email }, { expiresIn: '1h' });
            const refreshToken = this.jwtService.sign({ id: user.id, sub: user.email }, { expiresIn: '1d' });


            response.setCookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 60 * 60 * 24, 
                path: '/',
            });

            response.status(200).send({
                token: token,
                refreshToken: refreshToken,
                name: user.name,
                isAdmin: user.isAdmin,
                isEmployee: user.isEmployee,
            });

        } catch (error) {
            throw error;
        }
    }

    async register(createUserDto: CreateUserDto) {

        try {
            const { id, name, phone, email, birthdate, isAdmin, isEmployee } = createUserDto;

            const payload = { id: id, sub: email };

            if (!isAdmin && !isEmployee) {
                throw new BadRequestException('User must be either an admin or an employee');
            };

            await this.usersService.create({
                id: id,
                name: name,
                phone: phone,
                email: email,
                birthdate: new Date(birthdate),
                isAdmin: isAdmin,
                isEmployee: isEmployee,
            });

            const token = this.jwtService.sign(payload, { expiresIn: '1h' });

            this.mailerService.sendMail({
                to: email,
                subject: 'Establece tu contraseña',
                template: 'set-password',
                context: {
                    name: name,
                    reset_link: `http://localhost:3000/auth/set-password?token=${token}`,
                }
            })

            return {
                message: 'User created successfully',
                token,
            }

        } catch (error) {
            if (error.code === 'P2002' && error.meta?.target) {
                if (error.meta.target.includes('id')) {
                    throw new ConflictException('User already exists');
                }
                if (error.meta.target.includes('email')) {
                    throw new ConflictException('Email is already registered');
                }
            }
            throw error;
        }
    }

    async signOut(response: FastifyReply) {
        response.clearCookie('refreshToken', { path: '/' });

        response.status(200).send({
            message: 'User signed out successfully',
        });
    }

    async setPassword(token: string, setPasswordUserDto: SetPasswordUserDto) {
        try {

            const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET }) as { id: string, sub: string };

            const user = await this.usersService.findOne(decoded.id);

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const hashedPassword = await bcrypt.hash(setPasswordUserDto.password, 10);

            const tokenSession = this.jwtService.sign({ id: user.id, sub: user.email }, { expiresIn: '1h' });
            const refreshToken = this.jwtService.sign({ id: user.id, sub: user.email }, { expiresIn: '1d' });

            await this.usersService.update(user.id, { password: hashedPassword, status: Status.ACTIVE });

            return {
                message: "Password updated successfully",
                token: tokenSession,
                refreshToken: refreshToken
            };
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Invalid or expired token');
            }
            throw error;
        }
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        try {

            const { email } = forgotPasswordDto;

            const user = await this.usersService.findOneByEmail(email);

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const token = this.jwtService.sign({ id: user.id, sub: user.email }, { expiresIn: '1h' });

            this.mailerService.sendMail({
                to: email,
                subject: 'Restablece tu contraseña',
                template: 'forgot-password',
                context: {
                    name: user.name,
                    reset_link: `http://localhost:3000/auth/set-password?token=${token}`,
                }
            })

            return {
                message: 'Email sent successfully',
                token: token,
            }
        } catch (error) {
            throw error;
        }

    }

    async refreshToken(token: string) {
        try {
            const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET }) as { id: string, sub: string };

            const user = await this.usersService.findOne(decoded.id);

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const tokenSession = this.jwtService.sign({ id: user.id, sub: user.email }, { expiresIn: '1h' });

            return {
                token: tokenSession,
            };
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Invalid or expired token');
            }
            throw error;
        }
    }

}
