import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, IsUUID } from "class-validator";


export enum Status {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export class CreateProductDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsEnum(Status)
    status?: Status;

    @IsNotEmpty()
    @IsString()
    categoryId: string;

    @IsNotEmpty()
    @IsString()
    supplierId: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsOptional()
    @IsString()
    concentration?: string;

    @IsOptional()
    @IsString()
    activeIngredient?: string;

    @IsOptional()
    @IsString()
    weight?: string;

    @IsOptional()
    @IsString()
    volume?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    ProductTag?: string[];

}
