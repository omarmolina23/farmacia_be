import { IsOptional, IsNotEmpty, IsEnum, IsString } from 'class-validator';

export enum Status {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(Status)
  @IsOptional()
  estado: Status;

}


