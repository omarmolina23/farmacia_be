import { IsNotEmpty, IsString, IsDate, IsBoolean, IsEmail, IsStrongPassword, IsEnum, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export enum Status {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export class CreateUserDto {

    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @IsStrongPassword()
    password?: string;

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    birthdate: Date;

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
