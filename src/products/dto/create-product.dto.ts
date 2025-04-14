import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from "class-validator";


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
    description: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsOptional()
    @IsEnum(Status)
    status?: Status;

    @IsNotEmpty()
    @IsString()
    categoryId: string;

    @IsOptional()
    @IsString()
    concentration: string;

    @IsOptional()
    @IsString()
    activeIngredient: string;

    @IsOptional()
    @IsString()
    weight: string;

    @IsOptional()
    @IsString()
    volume: string;
}
