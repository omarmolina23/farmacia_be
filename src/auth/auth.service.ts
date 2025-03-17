import { ConflictException, UnauthorizedException, Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { SetPasswordUserDto } from 'src/users/dto/set-password-user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { Status } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailerService: MailerService

    ) { }

    async login(email: string, password: string) {
        try {

            const user = await this.usersService.findOneByEmail(email);

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            if (!user.password) {
                throw new UnauthorizedException('Password not set');
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

            return {
                token,
                refreshToken,
                isAdmin: user.isAdmin,
                isEmployee: user.isEmployee,
            }
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
                subject: 'Restablece tu contraseña',
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

    async setPassword(token: string, setPasswordUserDto: SetPasswordUserDto) {
        try {

            const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET }) as { id: string, sub: string };

            const user = await this.usersService.findOne(decoded.id);

            if (!user) {
                throw new UnauthorizedException('User not found');
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

    async refreshToken(token: string) {
        try {
            const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET }) as { id: string, sub: string };

            const user = await this.usersService.findOne(decoded.id);

            if (!user) {
                throw new UnauthorizedException('User not found');
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
