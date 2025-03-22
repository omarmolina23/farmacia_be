import { IsOptional, IsNotEmpty, IsEnum, IsString } from 'class-validator';

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Status)
  @IsOptional()
  status: Status;

}


