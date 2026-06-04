import DATABASE from "@/src/core/config/db";
import { SaleType } from "../types/sale.type";

export const SalesService = {
  createSale: async (
    sale: Omit<SaleType, 'id' | 'created_at'>,
    products: { product_id: number; quantity: number; price: number }[]
  ): Promise<SaleType> => {
    const createdAtStr = new Date().toISOString().split("T")[0];
    const debtDateStr = sale.debt_date ? new Date(sale.debt_date).toISOString().split("T")[0] : null;

    let saleId = 0;

    await DATABASE.db.withTransactionAsync(async () => {
      const result = await DATABASE.db.runAsync(
        "INSERT INTO sales (total, note, is_debt, debt_amount, debt_date, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          sale.total,
          sale.note || '',
          sale.is_debt ? 1 : 0,
          sale.debt_amount || 0,
          debtDateStr,
          createdAtStr
        ]
      );
      saleId = result.lastInsertRowId;

      for (const prod of products) {
        await DATABASE.db.runAsync(
          "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [saleId, prod.product_id, prod.quantity, prod.price]
        );

        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [prod.quantity, prod.product_id]
        );
      }
    });

    return {
      id: saleId,
      total: sale.total,
      note: sale.note,
      is_debt: sale.is_debt,
      debt_amount: sale.debt_amount,
      debt_date: sale.debt_date,
      created_at: new Date(createdAtStr)
    };
  },

  getSales: async (): Promise<SaleType[]> => {
    const sales = await DATABASE.db.getAllAsync("SELECT * FROM sales ORDER BY created_at DESC");
    return sales.map((sale: any) => ({
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null
    }));
  },

  getReportsSummary: async (): Promise<{
    totalDay: number;
    totalMonth: number;
    debtTotal: number;
    paidTotal: number;
    weeklySales: { dateStr: string; total: number }[];
    recentSales: SaleType[];
  }> => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Calcular fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDateStr = sevenDaysAgo.toISOString().split("T")[0];

    const [
      rowDay,
      rowMonth,
      rowDebt,
      rowPaid,
      weeklySales,
      recentSalesRaw
    ] = await Promise.all([
      DATABASE.db.getFirstAsync("SELECT SUM(total) as total FROM sales WHERE created_at = ?", [todayStr]),
      DATABASE.db.getFirstAsync("SELECT SUM(total) as total FROM sales"),
      DATABASE.db.getFirstAsync("SELECT SUM(debt_amount) as total FROM sales WHERE is_debt = 1"),
      DATABASE.db.getFirstAsync("SELECT SUM(total) as total FROM sales WHERE is_debt = 0"),
      DATABASE.db.getAllAsync("SELECT created_at as dateStr, SUM(total) as total FROM sales WHERE created_at >= ? GROUP BY created_at", [startDateStr]),
      DATABASE.db.getAllAsync("SELECT * FROM sales ORDER BY created_at DESC LIMIT 5")
    ]);

    const recentSales = (recentSalesRaw || []).map((sale: any) => ({
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null
    }));

    return {
      totalDay: (rowDay as any)?.total || 0,
      totalMonth: (rowMonth as any)?.total || 0,
      debtTotal: (rowDebt as any)?.total || 0,
      paidTotal: (rowPaid as any)?.total || 0,
      weeklySales: (weeklySales || []) as { dateStr: string; total: number }[],
      recentSales
    };
  },

  getSaleById: async (id: number): Promise<(SaleType & { products: any[] }) | null> => {
    const sale: any = await DATABASE.db.getFirstAsync("SELECT * FROM sales WHERE id = ?", [id]);
    if (!sale) return null;

    const products = await DATABASE.db.getAllAsync(
      `SELECT sp.*, p.name as product_name, p.image_url as product_image 
       FROM sale_products sp
       JOIN products p ON sp.product_id = p.id
       WHERE sp.sale_id = ?`,
      [id]
    );

    return {
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null,
      products
    };
  },

  updateSale: async (id: number, sale: Partial<SaleType>): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (sale.total !== undefined) { fields.push("total = ?"); values.push(sale.total); }
    if (sale.note !== undefined) { fields.push("note = ?"); values.push(sale.note); }
    if (sale.is_debt !== undefined) { fields.push("is_debt = ?"); values.push(sale.is_debt ? 1 : 0); }
    if (sale.debt_amount !== undefined) { fields.push("debt_amount = ?"); values.push(sale.debt_amount); }
    if (sale.debt_date !== undefined) {
      fields.push("debt_date = ?");
      values.push(sale.debt_date ? new Date(sale.debt_date).toISOString().split("T")[0] : null);
    }
    if (sale.created_at !== undefined) {
      fields.push("created_at = ?");
      values.push(new Date(sale.created_at || "").toISOString().split("T")[0]);
    }

    if (fields.length === 0) return;

    values.push(id);
    await DATABASE.db.runAsync(
      `UPDATE sales SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  deleteSale: async (id: number): Promise<void> => {
    await DATABASE.db.withTransactionAsync(async () => {
      // 1. Obtener productos de la venta para devolverlos al stock
      const saleProducts: any[] = await DATABASE.db.getAllAsync(
        "SELECT product_id, quantity FROM sale_products WHERE sale_id = ?",
        [id]
      );

      // 2. Devolver stock de cada producto
      for (const item of saleProducts) {
        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }

      // 3. Eliminar los productos de la venta y la venta
      await DATABASE.db.runAsync("DELETE FROM sale_products WHERE sale_id = ?", [id]);
      await DATABASE.db.runAsync("DELETE FROM sales WHERE id = ?", [id]);
    });
  },

  getTodaySales: async (): Promise<SaleType[]> => {
    const todayStr = new Date().toISOString().split("T")[0];
    const sales = await DATABASE.db.getAllAsync("SELECT * FROM sales WHERE created_at = ?", [todayStr]);
    return sales.map((sale: any) => ({
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null
    }));
  },

  getDebtSales: async (): Promise<SaleType[]> => {
    const sales = await DATABASE.db.getAllAsync("SELECT * FROM sales WHERE is_debt = 1 ORDER BY created_at DESC");
    return sales.map((sale: any) => ({
      ...sale,
      is_debt: true,
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null
    }));
  },

  markSaleAsPaid: async (saleId: number): Promise<void> => {
    await DATABASE.db.runAsync(
      "UPDATE sales SET is_debt = 0, debt_amount = 0 WHERE id = ?",
      [saleId]
    );
  },

  createMany: async (sales: SaleType[]) => {
    const salesCount: { count: number } | null = await DATABASE.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM sales",
    );

    console.log(salesCount?.count, typeof salesCount);

    if (salesCount?.count === 0) {
      await DATABASE.db.withTransactionAsync(async () => {
        for (const sale of sales) {
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [sale.id!, sale.total, sale.note || "", sale.is_debt ? 1 : 0, sale.debt_amount || null, sale.debt_date ? new Date(sale.debt_date).toISOString().split("T")[0] : null, new Date().toISOString().split("T")[0]],
          );
        }
      });
    }
  },
}