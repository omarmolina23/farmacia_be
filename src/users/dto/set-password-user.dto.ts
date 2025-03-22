import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class SetPasswordUserDto {

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    password: string;

}