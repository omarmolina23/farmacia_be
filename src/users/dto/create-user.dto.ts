import { IsNotEmpty } from "class-validator";
export class CreateUserDto {
    @IsNotEmpty()
    id: string;

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    email: string;

    password?: string;

    @IsNotEmpty()
    birthdate: Date;

    isActive?: boolean;

    isAdmin?: boolean;

    isEmployee?: boolean;
}
