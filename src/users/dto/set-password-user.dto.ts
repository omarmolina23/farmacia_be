import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { IsStrongPasswordCustom } from "../validators/is-strong-password.decorator";

export class SetPasswordUserDto {

    @IsNotEmpty()
    @IsString()
    @IsStrongPasswordCustom()
    password: string;

}