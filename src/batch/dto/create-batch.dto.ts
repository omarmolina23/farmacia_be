import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDate, IsEnum } from "class-validator";
import { Type } from "class-transformer";

export enum Status {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export class CreateBatchDto {
    
    @IsNotEmpty()
    @IsString()
    productId: string

    @IsNotEmpty()
    @IsString()
    supplierId: string

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    expirationDate: Date

    @IsOptional()
    @IsEnum(Status)
    status?: Status

    @IsNotEmpty()
    @IsString()
    number_batch: string

    @IsNotEmpty()
    @IsNumber()
    amount: number
}



