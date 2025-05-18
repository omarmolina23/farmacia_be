// src/invoice/invoice.module.ts
import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Module({
  providers: [InvoiceService],
  exports: [InvoiceService], // Exporta el servicio para que otros módulos lo puedan usar
})
export class InvoiceModule {}
