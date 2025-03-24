import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean, IsPhoneNumber} from 'class-validator';
import { IsStrongPasswordCustom } from '../validators/is-strong-password.decorator';

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
    @IsEnum(Status)
    status?: Status;

    @IsOptional()
    @IsBoolean()
    isAdmin?: boolean;

    @IsOptional()
    @IsBoolean()
    isEmployee?: boolean;
 }
