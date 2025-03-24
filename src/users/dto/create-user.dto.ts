import { IsNotEmpty, IsString, IsDate, IsBoolean, IsEmail, IsStrongPassword, IsEnum, IsOptional, IsPhoneNumber } from "class-validator";
import { IsStrongPasswordCustom } from "../validators/is-strong-password.decorator";
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
    @IsPhoneNumber()
    phone: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @IsStrongPasswordCustom()
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
