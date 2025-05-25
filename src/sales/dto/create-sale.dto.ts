import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateSaleProductClientDto } from './create-sale-product-client.dto';

export class CreateSaleDto {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsOptional()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty()
  @IsString()
  employeeName: string;

  @IsOptional()
  @IsDecimal()
  total: number;

  @IsOptional()
  @IsNumber()
  bill_id: number;

  @IsOptional()
  @IsString()
  number_e_invoice: string;

  @IsOptional()
  @IsString()
  number_credit_note: string;

  @IsOptional()
  @IsString()
  cufe: string;

  @IsOptional()
  @IsString()
  qr_image: string;

  @IsOptional()
  @IsBoolean()
  repaid: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleProductClientDto)
  products: CreateSaleProductClientDto[];
}
