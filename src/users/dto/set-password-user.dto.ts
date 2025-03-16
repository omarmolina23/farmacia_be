import { IsNotEmpty } from "class-validator";

export class SetPasswordUserDto {

    @IsNotEmpty()
    password: string;

}