import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean, IsPhoneNumber, IsDate} from 'class-validator';
import { IsStrongPasswordCustom } from '../validators/is-strong-password.decorator';
import { Type } from 'class-transformer';

export enum Status {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export class UpdateUserDto {

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsPhoneNumber()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @IsStrongPasswordCustom()
    password?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    birthdate?: Date;

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
