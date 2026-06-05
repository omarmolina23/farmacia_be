import { PrismaClient, documentType, Status, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================
//  Cantidades a generar — ajústalas según necesites
// ============================================================
const COUNTS = {
  users: 50,
  clients: 1000,
  suppliers: 50,
  categories: 20,
  tags: 15,
  products: 2000,
  batchesPerProduct: 2, // lotes por producto
  sales: 5000,
  maxProductsPerSale: 4, // líneas máximas por venta
};

// Inserta en bloques para no saturar la conexión
const CHUNK = 1000;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function createManyChunked<T>(
  label: string,
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>,
) {
  let done = 0;
  for (const part of chunk(rows, CHUNK)) {
    await insert(part);
    done += part.length;
    process.stdout.write(`\r   ${label}: ${done}/${rows.length}`);
  }
  process.stdout.write('\n');
}

async function main() {
  console.time('seed');
  faker.seed(123); // datos reproducibles
  console.log('🌱 Iniciando seed masivo...\n');

  // ----- Limpieza (orden inverso por las relaciones) -----
  console.log('🧹 Limpiando tablas...');
  await prisma.saleBatch.deleteMany();
  await prisma.saleProductClient.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================
  //  Usuarios
  // ============================================================
  const hashedPassword = await bcrypt.hash('Admin123*', 10);
  const users: Prisma.UserCreateManyInput[] = [
    {
      id: '1000000001',
      documentType: documentType.CC,
      name: 'Administrador Principal',
      phone: '3001112233',
      email: 'admin@nuevaesperanza.online',
      password: hashedPassword,
      birthdate: new Date('1990-01-15'),
      status: Status.ACTIVE,
      isAdmin: true,
      isEmployee: false,
    },
  ];
  const usedUserIds = new Set<string>(['1000000001']);
  while (users.length < COUNTS.users) {
    const id = faker.string.numeric(10);
    if (usedUserIds.has(id)) continue;
    usedUserIds.add(id);
    users.push({
      id,
      documentType: documentType.CC,
      name: faker.person.fullName(),
      phone: `3${faker.string.numeric(9)}`,
      email: faker.internet.email().toLowerCase(),
      password: hashedPassword,
      birthdate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      status: Status.ACTIVE,
      isAdmin: false,
      isEmployee: true,
    });
  }
  await createManyChunked('Usuarios', users, (b) =>
    prisma.user.createMany({ data: b, skipDuplicates: true }),
  );
  const employeeNames = users.map((u) => u.name);

  // ============================================================
  //  Clientes
  // ============================================================
  const clients: Prisma.ClientCreateManyInput[] = [];
  const usedClientIds = new Set<string>();
  while (clients.length < COUNTS.clients) {
    const id = faker.string.numeric(10);
    if (usedClientIds.has(id)) continue;
    usedClientIds.add(id);
    clients.push({
      id,
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: `3${faker.string.numeric(9)}`,
    });
  }
  await createManyChunked('Clientes', clients, (b) =>
    prisma.client.createMany({ data: b, skipDuplicates: true }),
  );
  const clientIds = clients.map((c) => c.id);

  // ============================================================
  //  Proveedores
  // ============================================================
  const suppliers: Prisma.SupplierCreateManyInput[] = [];
  const usedSupplierEmails = new Set<string>();
  while (suppliers.length < COUNTS.suppliers) {
    const email = faker.internet.email().toLowerCase();
    if (usedSupplierEmails.has(email)) continue;
    usedSupplierEmails.add(email);
    suppliers.push({
      id: faker.string.uuid(),
      name: faker.company.name(),
      phone: `60${faker.string.numeric(8)}`,
      email,
      status: Status.ACTIVE,
    });
  }
  await createManyChunked('Proveedores', suppliers, (b) =>
    prisma.supplier.createMany({ data: b, skipDuplicates: true }),
  );
  const supplierIds = suppliers.map((s) => s.id!);

  // ============================================================
  //  Categorías
  // ============================================================
  const categories: Prisma.CategoryCreateManyInput[] = Array.from(
    { length: COUNTS.categories },
    () => ({
      id: faker.string.uuid(),
      name: faker.commerce.department(),
    }),
  );
  await prisma.category.createMany({ data: categories, skipDuplicates: true });
  console.log(`   Categorías: ${categories.length}/${categories.length}`);
  const categoryIds = categories.map((c) => c.id!);

  // ============================================================
  //  Tags
  // ============================================================
  const tags: Prisma.TagCreateManyInput[] = Array.from(
    { length: COUNTS.tags },
    () => ({ id: faker.string.uuid(), name: faker.commerce.productAdjective() }),
  );
  await prisma.tag.createMany({ data: tags, skipDuplicates: true });
  console.log(`   Tags: ${tags.length}/${tags.length}`);
  const tagIds = tags.map((t) => t.id!);

  // ============================================================
  //  Productos (+ Tags, Imágenes, Lotes)
  // ============================================================
  const products: Prisma.ProductCreateManyInput[] = [];
  const productTags: Prisma.ProductTagCreateManyInput[] = [];
  const productImages: Prisma.ProductImageCreateManyInput[] = [];
  const batches: Prisma.BatchCreateManyInput[] = [];
  // guardamos lotes por producto para usarlos en las ventas
  const batchesByProduct = new Map<string, { id: string; available: number }[]>();

  for (let i = 0; i < COUNTS.products; i++) {
    const id = faker.string.uuid();
    const price = faker.number.int({ min: 1000, max: 80000 });
    products.push({
      id,
      barcode: faker.string.numeric(13),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription().slice(0, 200),
      categoryId: faker.helpers.arrayElement(categoryIds),
      supplierId: faker.helpers.arrayElement(supplierIds),
      price,
      concentration: faker.helpers.arrayElement(['250mg', '500mg', '1g', '5ml', null]),
      activeIngredient: faker.helpers.arrayElement([
        'Acetaminofén',
        'Ibuprofeno',
        'Amoxicilina',
        'Loratadina',
        null,
      ]),
    });

    // tags (1-3 distintos por producto)
    const productTagIds = faker.helpers.arrayElements(
      tagIds,
      faker.number.int({ min: 1, max: 3 }),
    );
    for (const tagId of productTagIds) {
      productTags.push({ id: faker.string.uuid(), productId: id, tagId });
    }

    // 1 imagen por producto
    productImages.push({
      id: faker.string.uuid(),
      productId: id,
      url: faker.image.url(),
    });

    // lotes
    const productBatches: { id: string; available: number }[] = [];
    for (let b = 0; b < COUNTS.batchesPerProduct; b++) {
      const batchId = faker.string.uuid();
      const amount = faker.number.int({ min: 20, max: 300 });
      batches.push({
        id: batchId,
        productId: id,
        number_batch: `L-${faker.string.alphanumeric(6).toUpperCase()}`,
        expirationDate: faker.date.future({ years: 3 }),
        entryDate: faker.date.recent({ days: 365 }),
        amount,
        available_amount: amount,
        purchaseValue: Math.round(price * 0.6),
      });
      productBatches.push({ id: batchId, available: amount });
    }
    batchesByProduct.set(id, productBatches);
  }

  await createManyChunked('Productos', products, (b) =>
    prisma.product.createMany({ data: b, skipDuplicates: true }),
  );
  await createManyChunked('ProductTags', productTags, (b) =>
    prisma.productTag.createMany({ data: b, skipDuplicates: true }),
  );
  await createManyChunked('Imágenes', productImages, (b) =>
    prisma.productImage.createMany({ data: b, skipDuplicates: true }),
  );
  await createManyChunked('Lotes', batches, (b) =>
    prisma.batch.createMany({ data: b, skipDuplicates: true }),
  );

  const productList = products.map((p) => ({ id: p.id!, price: Number(p.price) }));

  // ============================================================
  //  Ventas (+ SaleProductClient, SaleBatch) y descuento de stock
  // ============================================================
  const sales: Prisma.SaleCreateManyInput[] = [];
  const saleProducts: Prisma.SaleProductClientCreateManyInput[] = [];
  const saleBatches: Prisma.SaleBatchCreateManyInput[] = [];

  for (let i = 0; i < COUNTS.sales; i++) {
    const saleId = faker.string.uuid();
    const lineCount = faker.number.int({ min: 1, max: COUNTS.maxProductsPerSale });
    const chosen = faker.helpers.arrayElements(productList, lineCount);

    let total = 0;
    const lines: {
      saleProductId: string;
      productId: string;
      amount: number;
    }[] = [];

    for (const prod of chosen) {
      const available = batchesByProduct.get(prod.id) ?? [];
      const batchWithStock = available.find((b) => b.available > 0);
      if (!batchWithStock) continue;

      const amount = faker.number.int({
        min: 1,
        max: Math.min(5, batchWithStock.available),
      });
      const saleProductId = faker.string.uuid();

      saleProducts.push({ id: saleProductId, saleId, productId: prod.id, amount });
      saleBatches.push({
        id: faker.string.uuid(),
        saleProductId,
        batchId: batchWithStock.id,
        quantity: amount,
      });
      batchWithStock.available -= amount;
      total += prod.price * amount;
      lines.push({ saleProductId, productId: prod.id, amount });
    }

    if (lines.length === 0) continue;

    sales.push({
      id: saleId,
      clientId: faker.helpers.arrayElement(clientIds),
      employeeName: faker.helpers.arrayElement(employeeNames),
      total,
      date: faker.date.recent({ days: 180 }),
      bill_id: i + 1,
    });
  }

  await createManyChunked('Ventas', sales, (b) =>
    prisma.sale.createMany({ data: b, skipDuplicates: true }),
  );
  await createManyChunked('Líneas de venta', saleProducts, (b) =>
    prisma.saleProductClient.createMany({ data: b, skipDuplicates: true }),
  );
  await createManyChunked('Venta-Lote', saleBatches, (b) =>
    prisma.saleBatch.createMany({ data: b, skipDuplicates: true }),
  );

  // Actualiza el stock disponible de cada lote afectado
  console.log('🔄 Actualizando stock de lotes...');
  let stockUpdates = 0;
  for (const [, productBatches] of batchesByProduct) {
    for (const b of productBatches) {
      await prisma.batch.update({
        where: { id: b.id },
        data: { available_amount: b.available },
      });
      stockUpdates++;
    }
  }
  console.log(`   Lotes actualizados: ${stockUpdates}`);

  console.log('\n✅ Seed masivo completado:');
  console.log(`   - ${users.length} usuarios (contraseña: Admin123*)`);
  console.log(`   - ${clients.length} clientes`);
  console.log(`   - ${suppliers.length} proveedores`);
  console.log(`   - ${categories.length} categorías, ${tags.length} tags`);
  console.log(`   - ${products.length} productos`);
  console.log(`   - ${batches.length} lotes`);
  console.log(`   - ${sales.length} ventas`);
  console.timeEnd('seed');
}

main()
  .catch((e) => {
    console.error('\n❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
