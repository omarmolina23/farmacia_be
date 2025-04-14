import {
  ConflictException,
  UnauthorizedException,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
    private mailerService: MailerService,
  ) {}

  async login(loginUserDto: LoginUserDto, response: FastifyReply) {
    try {
      const { email, password } = loginUserDto;

      const user = await this.usersService.findOneByEmail(email);

      if (!user.password) {
        throw new BadRequestException('Contraseña no establecida');
      }

      if (user.status === Status.INACTIVE) {
        throw new UnauthorizedException('El usuario no está activo');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const token = this.jwtService.sign(
        {
          id: user.id,
          isAdmin: user.isAdmin,
          isEmployee: user.isEmployee,
          sub: user.email,
        },
        { expiresIn: '1h' },
      );
      const refreshToken = this.jwtService.sign(
        { id: user.id, sub: user.email },
        { expiresIn: '1d' },
      );

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
        status: user.status,
      });
    } catch (error) {
      throw error;
    }
  }

  async register(createUserDto: CreateUserDto) {
    try {
      const {
        id,
        documentType,
        name,
        phone,
        email,
        birthdate,
        isAdmin,
        isEmployee,
      } = createUserDto;

      const payload = { id: id, sub: email };

      if (!isAdmin && !isEmployee) {
        throw new BadRequestException(
          'El usuario debe ser administrador o al menos empleado',
        );
      }

        const birthDate = new Date(birthdate);
        const today = new Date();

        if (birthDate > today) {
            throw new BadRequestException('La fecha de nacimiento no puede ser en el futuro');
        }

        const age = today.getFullYear() - birthDate.getFullYear();
        const hasBirthdayPassed =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

        const actualAge = hasBirthdayPassed ? age : age - 1;

        if (actualAge < 18) {
            throw new BadRequestException('El usuario debe tener al menos 18 años');
        }


        await this.usersService.create({
            id: id,
            documentType: documentType,
            name: name,
            phone: phone,
            email: email,
            birthdate: new Date(birthdate),
            isAdmin: isAdmin,
            isEmployee: isEmployee,
        });

        const token = this.jwtService.sign(payload, { expiresIn: '1h' });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        try {
            await this.mailerService.sendMail({
            to: email,
            subject: 'Establece tu contraseña',
            template: 'set-password',
            context: {
                name: name,
                reset_link: `${frontendUrl}/reset-password?token=${token}`,
            },
            });
        } catch (error) {
            throw new BadRequestException(
            'Error al enviar el correo de verificación',
            );
        }

      return {
        message: 'Usuario registrado exitosamente',
        token,
      };
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target) {
        if (error.meta.target.includes('id')) {
          throw new ConflictException('El usuario ya está registrado');
        }
        if (error.meta.target.includes('email')) {
          throw new ConflictException('El email ya está registrado');
        }
      }
      throw error;
    }
  }

  async signOut(response: FastifyReply) {
    response.clearCookie('refreshToken', { path: '/' });

    response.status(200).send({
      message: 'Se ha cerrado la sesión correctamente',
    });
  }

  async setPassword(token: string, setPasswordUserDto: SetPasswordUserDto) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      }) as { id: string; sub: string };

      const user = await this.usersService.findOne(decoded.id);

      if (!user) {
        throw new NotFoundException('Correo no encontrado');
      }

      const hashedPassword = await bcrypt.hash(setPasswordUserDto.password, 10);

      const tokenSession = this.jwtService.sign(
        { id: user.id, sub: user.email },
        { expiresIn: '1h' },
      );
      const refreshToken = this.jwtService.sign(
        { id: user.id, sub: user.email },
        { expiresIn: '1d' },
      );

      await this.usersService.update(user.id, {
        password: hashedPassword,
        status: Status.ACTIVE,
      });

      return {
        message: 'Contraseña establecida correctamente',
        token: tokenSession,
        refreshToken: refreshToken,
      };
    } catch (error) {
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Token inválido o expirado');
      }
      throw error;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const { email } = forgotPasswordDto;

      const user = await this.usersService.findOneByEmail(email);

      if (!user) {
        throw new NotFoundException('Correo no encontrado');
      }

      const token = this.jwtService.sign(
        { id: user.id, sub: user.email },
        { expiresIn: '1h' },
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      this.mailerService.sendMail({
        to: email,
        subject: 'Restablece tu contraseña',
        template: 'forgot-password',
        context: {
          name: user.name,
          reset_link: `${frontendUrl}/reset-password?token=${token}`,
        },
      });

      return {
        message: 'Email sent successfully',
        token: token,
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken?: string) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Token no proporcionado');
      }

      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      }) as { id: string; sub: string };

      const user = await this.usersService.findOne(decoded.id);

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const tokenSession = this.jwtService.sign(
        {
          id: user.id,
          isAdmin: user.isAdmin,
          isEmployee: user.isEmployee,
          sub: user.email,
        },
        { expiresIn: '1h' },
      );

      return {
        token: tokenSession,
      };
    } catch (error) {
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Token inválido o expirado');
      }
      throw error;
    }
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      }) as { id: string; sub: string };
      return decoded;
    } catch (error) {
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Token inválido o expirado');
      }
      throw error;
    }
  }
}
