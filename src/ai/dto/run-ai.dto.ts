import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class RunAiDto {
  @IsObject()
  context: Record<string, unknown>;

  @IsNotEmpty()
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  restrictions?: string;
}
