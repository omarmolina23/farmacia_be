import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { SetPasswordUserDto } from 'src/users/dto/set-password-user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';


import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailerService: MailerService
 
    ) { }

    async register(createUserDto: CreateUserDto) {
        const { id, name, email, password, birthdate, isAdmin, isEmployee } = createUserDto;

        const payload = { id: id, sub: email };

        const token = this.jwtService.sign(payload);

        console.log(email);

        const data = this.mailerService.sendMail({
            to: email,
            subject: 'Restablece tu contraseña',
            template: 'set-password', // Nombre del archivo en la carpeta /templates
            context: {
                reset_link: "www.google.com",
            }
        })

        return {
            token
        }
    
    }

    async setPassword(token: string, setPasswordUserDto: SetPasswordUserDto) {
    
        const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET }) as { id: string, sub: string };
        
        const user = await this.usersService.findOne(decoded.id);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const hashedPassword = await bcrypt.hash(setPasswordUserDto.password, 10);

        await this.usersService.update(user.id, { password: hashedPassword, isActive: true });
    }

    

}
