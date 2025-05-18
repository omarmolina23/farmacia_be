import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDecimal, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateSaleProductClientDto } from "./create-sale-product-client.dto";

export class CreateSaleDto {

    @IsNotEmpty()
    @IsString()
    clientId: string


    @IsNotEmpty()
    @IsString()
    employeeName: string

    @IsOptional()
    @IsDecimal()
    total: number

    @IsOptional()
    @IsString()
    bill_id: string

    @IsOptional()
    @IsString()
    factus_number: string

    @IsOptional()
    @IsString()
    cufe: string

    @IsOptional()
    @IsString()
    qr_image: string

    @IsOptional()
    @IsBoolean()
    repaid: boolean

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSaleProductClientDto)
    products: CreateSaleProductClientDto[];
}