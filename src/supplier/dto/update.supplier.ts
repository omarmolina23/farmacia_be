import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create.supplier';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}