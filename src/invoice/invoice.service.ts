// invoice.service.ts
import * as fs from 'fs/promises';
import * as mustache from 'mustache';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

export class InvoiceService {
    async generateInvoicePdf(invoiceData: any): Promise<Buffer> {

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'invoice-email.html');

        // 1. Cargar la plantilla
        const template = await fs.readFile(templatePath, 'utf-8');

        // ¿Es una nota de crédito (devolución)? Se puede indicar explícitamente
        // con isCreditNote o, si no, se infiere de que la venta esté devuelta.
        const isCreditNote = invoiceData.isCreditNote ?? invoiceData.sale.repaid ?? false;

        // 3. Renderizar HTML
        const html = mustache.render(template, {
            isCreditNote,
            documentTitle: isCreditNote ? 'Nota de Crédito' : 'Factura de venta',
            clientName: invoiceData.clientFound[0].name.toUpperCase(),
            clientId: invoiceData.clientFound[0].id,
            clientEmail: invoiceData.clientFound[0].email,
            employeeName: invoiceData.sale.employeeName,
            date: invoiceData.sale.date.toLocaleDateString('es-ES', {
                timeZone: 'America/Bogota',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            invoiceNumber: invoiceData.sale.id || 'No disponible',
            invoiceENumber: invoiceData.sale.number_e_invoice || 'No disponible',
            creditNoteNumber: invoiceData.sale.number_credit_note || 'No disponible',
            cufe: invoiceData.sale.cufe || 'No disponible',
            cufeLabel: isCreditNote ? 'CUDE' : 'CUFE',
            qrImage: invoiceData.sale.qr_image || '',
            items: invoiceData.detailedProducts,
            total: invoiceData.sale.total.toFixed(2),
        });

        // 4. Generar PDF con Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });

        const pdfUint8Array = await page.pdf({ format: 'A4' });
        await browser.close();

        return Buffer.from(pdfUint8Array);
    }
}