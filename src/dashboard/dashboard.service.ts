import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { subDays, startOfWeek, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getPercentageChange(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  async getDailyStatus() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(todayStart.getDate() - 1);

      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(todayEnd.getDate() - 1);

      // CLIENTES (únicos que compraron hoy)
      const clientsToday = await this.prisma.sale.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        distinct: ['clientId'],
        select: { clientId: true },
      });

      const clientsYesterday = await this.prisma.sale.findMany({
        where: {
          date: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
        distinct: ['clientId'],
        select: { clientId: true },
      });

      const clientsCountToday = clientsToday.length;
      const clientsCountYesterday = clientsYesterday.length;

      const clientsChange = this.getPercentageChange(
        clientsCountToday,
        clientsCountYesterday,
      );

      // ======= INVENTARIO =======
      const batches = await this.prisma.batch.findMany({
        where: {
          status: 'ACTIVE',
          isExpired: false,
        },
        select: {
          available_amount: true,
        },
      });

      const inventoryToday = batches.reduce(
        (sum, b) => sum + b.available_amount,
        0,
      );
      // No tiene sentido histórico, así que dejamos change en 0
      const inventoryChange = 0;

      // ======= VENTAS =======
      const salesToday = await this.prisma.sale.count({
        where: {
          date: { gte: todayStart, lte: todayEnd },
        },
      });

      const salesYesterday = await this.prisma.sale.count({
        where: {
          date: { gte: yesterdayStart, lte: yesterdayEnd },
        },
      });

      const salesChange = this.getPercentageChange(salesToday, salesYesterday);

      // ======= INGRESOS =======
      const salesAmountToday = await this.prisma.sale.aggregate({
        _sum: {
          total: true,
        },
        where: {
          date: { gte: todayStart, lte: todayEnd },
        },
      });

      const salesAmountYesterday = await this.prisma.sale.aggregate({
        _sum: {
          total: true,
        },
        where: {
          date: { gte: yesterdayStart, lte: yesterdayEnd },
        },
      });

      const ingresosToday = Number(salesAmountToday._sum.total ?? 0);
      const ingresosYesterday = Number(salesAmountYesterday._sum.total ?? 0);
      const ingresosChange = this.getPercentageChange(
        ingresosToday,
        ingresosYesterday,
      );

      // ======= RESPUESTA =======
      return [
        {
          title: 'Clientes',
          value: clientsCountToday,
          change: clientsChange,
        },
        {
          title: 'Inventario',
          value: inventoryToday,
          change: inventoryChange,
        },
        {
          title: 'Ventas',
          value: salesToday,
          change: salesChange,
        },
        {
          title: 'Ingresos',
          value: ingresosToday,
          change: ingresosChange,
        },
      ];
    } catch (error) {
      throw new BadRequestException('Error al obtener el estado diario');
    }
  }

  async getRecentSales() {
    try {
      const recentSales = await this.prisma.sale.findMany({
        take: 5,
        orderBy: {
          date: 'desc',
        },
        select: {
          date: true,
          total: true,
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return recentSales.map((sale) => ({
        fecha: sale.date,
        nombre: sale.client.name,
        correo: sale.client.email,
        monto_total: sale.total,
      }));
    } catch (error) {
      throw new BadRequestException('Error al obtener las ventas recientes');
    }
  }

  async getProductsSold() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(todayStart.getDate() - 1);

      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(todayEnd.getDate() - 1);

      // Obtener IDs de ventas de hoy
      const salesToday = await this.prisma.sale.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        select: { id: true },
      });
      const saleIdsToday = salesToday.map((s) => s.id);

      // Obtener IDs de ventas de ayer
      const salesYesterday = await this.prisma.sale.findMany({
        where: { date: { gte: yesterdayStart, lte: yesterdayEnd } },
        select: { id: true },
      });
      const saleIdsYesterday = salesYesterday.map((s) => s.id);

      // Agrupar productos vendidos hoy por productId sumando amount
      const productsToday = await this.prisma.saleProductClient.groupBy({
        by: ['productId'],
        where: { saleId: { in: saleIdsToday } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      });

      // Agrupar productos vendidos ayer
      const productsYesterday = await this.prisma.saleProductClient.groupBy({
        by: ['productId'],
        where: { saleId: { in: saleIdsYesterday } },
        _sum: { amount: true },
      });

      // Mapa para buscar ventas de ayer
      const yesterdayMap = new Map(
        productsYesterday.map((p) => [p.productId, p._sum.amount ?? 0]),
      );

      // Total ventas cantidad hoy y ayer
      const totalToday = productsToday.reduce(
        (sum, p) => sum + (p._sum.amount ?? 0),
        0,
      );
      const totalYesterday = productsYesterday.reduce(
        (sum, p) => sum + (p._sum.amount ?? 0),
        0,
      );

      // Obtener nombres de productos para el top de hoy
      const productIds = productsToday.map((p) => p.productId);
      const productsInfo = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });

      // Armar arreglo con nombre y cantidad vendida
      const products = productsToday.map((p) => {
        const prodInfo = productsInfo.find((pi) => pi.id === p.productId);
        return {
          product: prodInfo?.name || 'Desconocido',
          sales: p._sum.amount ?? 0,
        };
      });

      // Calcular porcentaje de cambio
      const percentChange = this.getPercentageChange(
        totalToday,
        totalYesterday,
      );

      return { products, percentChange };
    } catch (error) {
      throw new BadRequestException('Error al obtener los productos vendidos');
    }
  }

  async getMinimumStockByMonth() {
    try {
      const batches = await this.prisma.batch.findMany({
        where: {
          status: 'ACTIVE',
          isExpired: false,
        },
        select: {
          available_amount: true,
          entryDate: true,
        },
      });

      const stocksByMonth: Record<number, number[]> = {};

      batches.forEach(({ available_amount, entryDate }) => {
        const month = entryDate.getMonth(); // 0 = Ene, 1 = Feb, ...
        if (!stocksByMonth[month]) {
          stocksByMonth[month] = [];
        }
        stocksByMonth[month].push(available_amount);
      });

      const monthNames = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ];

      const result = Object.entries(stocksByMonth).map(
        ([monthStr, amounts]) => {
          const monthIndex = Number(monthStr);
          return {
            month: monthNames[monthIndex],
            Stock: Math.min(...amounts),
          };
        },
      );

      // Ordenamos por mes (opcional)
      result.sort(
        (a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month),
      );

      return result;
    } catch (error) {
      throw new BadRequestException('Error al obtener el stock mínimo por mes');
    }
  }

  async getSalesByCategoryWeekly() {
    try {
      // Obtener todas las ventas con sus productos y categorías dentro de un rango razonable (ejemplo últimos 3 meses)
      const salesWithProducts = await this.prisma.saleProductClient.findMany({
        select: {
          amount: true,
          venta: {
            select: {
              date: true,
            },
          },
          products: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        where: {
          venta: {
            date: {
              gte: subDays(new Date(), 90), // últimos 90 días
            },
          },
        },
      });

      // Agrupar por semana y categoría
      const grouped: Record<string, Record<string, number>> = {}; // { "2025-01-11": { analgésicos: 146, ... } }

      for (const item of salesWithProducts) {
        // Fecha de la venta
        const saleDate = item.venta.date;
        // Obtener el inicio de la semana (lunes)
        const weekStart = startOfWeek(saleDate, { weekStartsOn: 1 }); // lunes como inicio de semana
        const weekKey = format(weekStart, 'yyyy-MM-dd');

        // Nombre categoría (ejemplo: "analgésicos")
        const categoryName = item.products.category.name;

        if (!grouped[weekKey]) grouped[weekKey] = {};
        if (!grouped[weekKey][categoryName]) grouped[weekKey][categoryName] = 0;

        grouped[weekKey][categoryName] += item.amount;
      }

      // Convertir el objeto agrupado a arreglo
      const result = Object.entries(grouped).map(([date, categories]) => ({
        date,
        ...categories,
      }));

      return result;
    } catch (error) {
      throw new BadRequestException(
        'Error al obtener las ventas por categoría semanal',
      );
    }
  }

  private async getProfitsByCategoryBetweenDates(
    start: Date,
    end: Date,
  ): Promise<Record<string, number>> {
    // Obtenemos categorías activas
    const categories = await this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    // Para cada categoría sumamos total de ventas de productos en esa categoría
    const profitsByCategory: Record<string, number> = {};

    for (const category of categories) {
      const salesSum = await this.prisma.saleProductClient.aggregate({
        _sum: {
          amount: true, // cantidad vendida
        },
        where: {
          venta: {
            date: {
              gte: start,
              lte: end,
            },
          },
          products: {
            categoryId: category.id,
          },
        },
      });

      // Ahora calculamos la ganancia para esta categoría:
      // Suposición simple: precio * cantidad. Si quieres tomar otra cosa, modifica aquí.
      const amount = salesSum._sum.amount ?? 0;

      // Sumamos precio * cantidad
      // Para optimizar, podrías calcular esto directo en la consulta SQL con joins y sumas.
      // Aquí haremos consulta para obtener suma precio * cantidad.

      const totalProfitData = await this.prisma.saleProductClient.findMany({
        where: {
          venta: {
            date: {
              gte: start,
              lte: end,
            },
          },
          products: {
            categoryId: category.id,
          },
        },
        select: {
          amount: true,
          products: {
            select: {
              price: true,
            },
          },
        },
      });

      let total = 0;
      for (const item of totalProfitData) {
        total += Number(item.amount) * Number(item.products.price);
      }

      profitsByCategory[category.name] = total;
    }

    return profitsByCategory;
  }

  async getProfitCategory() {
    try {
      // Fechas actuales y pasadas para cada periodo y su periodo anterior para % cambio
      const now = new Date();

      const periods = {
        ultimos_7_dias: {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          prevStart: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        },
        ultimos_30_dias: {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          prevStart: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        },
        ultimos_3_meses: {
          start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          prevStart: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        },
      };

      // Para cada periodo calculamos ganancia por categoría y total
      const ganancias_por_categoria = {};
      const total_ganancias = {};

      for (const key of Object.keys(periods)) {
        const period = periods[key];
        const start = period.start;
        const prevStart = period.prevStart;
        const end = now;
        const prevEnd = period.start;

        // Ganancias en el periodo actual
        const profitsCurrent = await this.getProfitsByCategoryBetweenDates(
          start,
          end,
        );

        // Ganancias en periodo anterior para % cambio
        const profitsPrev = await this.getProfitsByCategoryBetweenDates(
          prevStart,
          prevEnd,
        );

        // Calculamos porcentaje por categoría
        const gananciasPorCategoriaConPorcentaje = {};
        for (const catName in profitsCurrent) {
          const total = profitsCurrent[catName];
          const prev = profitsPrev[catName] ?? 0;
          const porcentaje = this.getPercentageChange(total, prev);
          gananciasPorCategoriaConPorcentaje[catName] = {
            total,
            porcentaje: +porcentaje.toFixed(1),
          };
        }
        ganancias_por_categoria[key] = gananciasPorCategoriaConPorcentaje;

        // Calculamos total general (sumatoria de categorías)
        const totalCurrent = Object.values(profitsCurrent).reduce(
          (a, b) => a + b,
          0,
        );
        const totalPrev = Object.values(profitsPrev).reduce((a, b) => a + b, 0);
        const totalPercentage = this.getPercentageChange(
          totalCurrent,
          totalPrev,
        );
        total_ganancias[key] = {
          total: totalCurrent,
          porcentaje: +totalPercentage.toFixed(1),
        };
      }

      return {
        ganancias_por_categoria,
        total_ganancias,
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener ganancias por categoría');
    }
  }
}
