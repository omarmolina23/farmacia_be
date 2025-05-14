import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDate, IsEnum, IsBoolean } from "class-validator";
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
    @Type(() => Date)
    @IsDate()
    expirationDate: Date

    @IsOptional()
    @IsEnum(Status)
    status?: Status

    @IsOptional()
    @IsBoolean()
    isExpired?: boolean

    @IsNotEmpty()
    @IsString()
    number_batch: string

    @IsNotEmpty()
    @IsNumber()
    amount: number

    @IsOptional()
    @IsNumber()
    available_amount?: number

    @IsNotEmpty()
    @IsNumber()
    purchaseValue: number;
}



