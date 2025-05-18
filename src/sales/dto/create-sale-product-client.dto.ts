import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateSaleProductClientDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  amount: number;
}
