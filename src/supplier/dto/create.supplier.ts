import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsString, IsPhoneNumber } from 'class-validator';

export enum Status {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  telefono: string;

  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsEnum(Status)
  @IsOptional()
  estado: Status;
}


