import { IsNotEmpty, IsString } from "class-validator"

export class CreateSaleDto {

    @IsNotEmpty()
    @IsString()
    number_credit_note: string
}