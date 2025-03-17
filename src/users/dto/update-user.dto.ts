import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean, IsStrongPassword } from 'class-validator';

export enum Status {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export class UpdateUserDto {

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @IsStrongPassword()
    password?: string;

    @IsOptional()
    @IsEnum(Status)
    status?: Status;

    @IsOptional()
    @IsBoolean()
    isAdmin?: boolean;

    @IsOptional()
    @IsBoolean()
    isEmployee?: boolean;


 }
