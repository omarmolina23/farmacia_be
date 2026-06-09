import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt } from 'crypto';
import { BrevoService } from 'src/brevo/brevo.service';

@Injectable()
export class ClientService {
  constructor(
    private prisma: PrismaService,
    private readonly mailerService: MailerService,
    private brevoService: BrevoService,
  ) {}

  private validateId(id: string) {
    const isNumeric = /^\d+$/.test(id); // Solo números
    if (!isNumeric || id.length < 8) {
      throw new BadRequestException(
        'La identificación debe contener solo números y tener al menos 8 dígitos',
      );
    }
  }

  async create(createClientDto: CreateClientDto) {
    try {
      const { id } = createClientDto;

      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (existingClient) {
        throw new BadRequestException('El cliente ya existe');
      }

      this.validateId(id);

      return await this.prisma.client.create({ data: createClientDto });
    } catch (error) {
      console.error('Error al crear el cliente:', error);
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.client.findMany();
  }

  async findOne(id: string) {
    try {
      const client = await this.prisma.client.findUnique({ where: { id } });
      if (!client) {
        throw new NotFoundException('Cliente no encontrado');
      }
      return client;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      const client = await this.prisma.client.findUnique({ where: { id } });
      if (!client) {
        throw new NotFoundException('Cliente no encontrado');
      }
      return await this.prisma.client.update({
        where: { id },
        data: updateClientDto,
      });
    } catch (error) {
      throw error;
    }
  }

  // Para pruebas, usa Map; en producción: Redis, DB, etc.
  private codes = new Map<string, string>();

  async sendVerificationCode(email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Correo electrónico inválido');
    }

    const code = randomInt(100000, 999999).toString();
    this.codes.set(email, code);

    // Buscamos el cliente por correo para personalizar el saludo del correo.
    // Si no existe (p. ej. aún no registrado), usamos un saludo genérico.
    const client = await this.prisma.client.findFirst({ where: { email } });
    const name = client?.name ?? 'cliente';

    /*
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Tu código de verificación',
        template: 'verification-code',
        context: {
          code: code,
        },
      });
    } catch (error) {
      throw new BadRequestException('Error al enviar el correo');
    }
    */

    try{
      await this.brevoService.sendMail(
        email,
        3, // Reemplaza con el Template ID de Brevo (verification-code)
        {
          code: code,
          name: name,
        }
      );
    } catch (error) {
      throw new BadRequestException('Error al enviar el correo');
    }

    return { message: 'Código enviado al correo electrónico', code: code, };
  }
}
