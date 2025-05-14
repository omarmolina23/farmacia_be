import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateClientDto {

    @IsNotEmpty()
    @IsString()
    id: string

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsNotEmpty()
    @IsString()
    phone: string
}