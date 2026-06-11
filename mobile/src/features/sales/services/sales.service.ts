import DATABASE from "@/src/core/config/db";
import { SaleType } from "../types/sale.type";

// TODO: Agregar nombre del cliente al getSaleById
export const SalesService = {
  createSale: async (
    sale: Omit<SaleType, "id" | "created_at">,
    products: { product_id: number; quantity: number; price: number }[],
  ): Promise<SaleType> => {
    const createdAtStr = new Date().toISOString();
    const debtDateStr = sale.debt_date
      ? new Date(sale.debt_date).toISOString().split("T")[0]
      : null;

    let saleId = 0;

    await DATABASE.db.withTransactionAsync(async () => {
      const result = await DATABASE.db.runAsync(
        "INSERT INTO sales (total, note, is_debt, debt_amount, debt_date, payment_method, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          sale.total,
          sale.note || "",
          sale.is_debt ? 1 : 0,
          sale.debt_amount || 0,
          debtDateStr,
          sale.payment_method || "cash",
          sale.client_id || null,
          createdAtStr,
        ],
      );
      saleId = result.lastInsertRowId;

      for (const prod of products) {
        await DATABASE.db.runAsync(
          "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [saleId, prod.product_id, prod.quantity, prod.price],
        );

        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [prod.quantity, prod.product_id],
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
      created_at: new Date(createdAtStr),
    };
  },

  getSales: async (): Promise<SaleType[]> => {
    const sales = await DATABASE.db.getAllAsync(
      `SELECT s.*, c.name as client_name 
       FROM sales s 
       LEFT JOIN clients c ON s.client_id = c.id 
       WHERE s.status IS NULL OR s.status != 'cancelled'
       ORDER BY s.created_at DESC`,
    );
    return sales.map((sale: any) => ({
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null,
      client: sale.client_id
        ? {
            id: sale.client_id,
            name: sale.client_name,
          }
        : null,
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

    // Primer y último día del mes actual
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDateStr = sevenDaysAgo.toISOString().split("T")[0];

    const [rowDay, rowMonth, rowDebt, rowPaid, weeklySales, recentSalesRaw] =
      await Promise.all([
        DATABASE.db.getFirstAsync(
          "SELECT SUM(total) as total FROM sales WHERE (status IS NULL OR status != 'cancelled') AND created_at LIKE ?",
          [`${todayStr}%`],
        ),
        DATABASE.db.getFirstAsync(
          "SELECT SUM(total) as total FROM sales WHERE (status IS NULL OR status != 'cancelled') AND created_at BETWEEN ? AND ?",
          [firstDay, lastDay],
        ), // fix
        DATABASE.db.getFirstAsync(
          "SELECT SUM(debt_amount) as total FROM sales WHERE is_debt = 1 AND (status IS NULL OR status != 'cancelled')",
        ),
        DATABASE.db.getFirstAsync(
          "SELECT SUM(total) as total FROM sales WHERE is_debt = 0 AND (status IS NULL OR status != 'cancelled') AND created_at LIKE ?",
          [`${todayStr}%`],
        ),
        DATABASE.db.getAllAsync(
          "SELECT substr(created_at, 1, 10) as dateStr, SUM(total) as total FROM sales WHERE (status IS NULL OR status != 'cancelled') AND created_at >= ? GROUP BY substr(created_at, 1, 10)",
          [startDateStr],
        ),
        DATABASE.db.getAllAsync(
          `SELECT s.*, c.name as client_name 
           FROM sales s 
           LEFT JOIN clients c ON s.client_id = c.id 
           WHERE s.status IS NULL OR s.status != 'cancelled' 
           ORDER BY s.created_at DESC LIMIT 5`,
        ),
      ]);

    const recentSales = (recentSalesRaw || []).map((sale: any) => ({
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null,
      client: sale.client_id
        ? {
            id: sale.client_id,
            name: sale.client_name,
          }
        : null,
    }));

    return {
      totalDay: (rowDay as any)?.total || 0,
      totalMonth: (rowMonth as any)?.total || 0,
      debtTotal: (rowDebt as any)?.total || 0,
      paidTotal: (rowPaid as any)?.total || 0,
      weeklySales: (weeklySales || []) as { dateStr: string; total: number }[],
      recentSales,
    };
  },

  getReportByRange: async (
    startDate: string,
    endDate: string,
  ): Promise<{
    totalSales: number;
    totalPaid: number;
    totalDebt: number;
    salesCount: number;
    salesByDay: { dateStr: string; total: number; count: number }[];
    topProducts: { name: string; quantity: number; total: number }[];
    sales: SaleType[];
  }> => {
    const end = `${endDate}T23:59:59`;

    const [rowTotal, rowPaid, rowDebt, rowCount, byDay, topProducts, salesRaw] =
      await Promise.all([
        DATABASE.db.getFirstAsync(
          "SELECT SUM(total) as total FROM sales WHERE (status IS NULL OR status != 'cancelled') AND created_at BETWEEN ? AND ?",
          [startDate, end],
        ),
        DATABASE.db.getFirstAsync(
          "SELECT SUM(total) as total FROM sales WHERE is_debt = 0 AND (status IS NULL OR status != 'cancelled') AND created_at BETWEEN ? AND ?",
          [startDate, end],
        ),
        DATABASE.db.getFirstAsync(
          "SELECT SUM(debt_amount) as total FROM sales WHERE is_debt = 1 AND (status IS NULL OR status != 'cancelled') AND created_at BETWEEN ? AND ?",
          [startDate, end],
        ),
        DATABASE.db.getFirstAsync(
          "SELECT COUNT(*) as count FROM sales WHERE (status IS NULL OR status != 'cancelled') AND created_at BETWEEN ? AND ?",
          [startDate, end],
        ),
        DATABASE.db.getAllAsync(
          `SELECT substr(created_at, 1, 10) as dateStr, SUM(total) as total, COUNT(*) as count 
       FROM sales WHERE (status IS NULL OR status != 'cancelled') AND created_at BETWEEN ? AND ? 
       GROUP BY substr(created_at, 1, 10) ORDER BY dateStr ASC`,
          [startDate, end],
        ),
        DATABASE.db.getAllAsync(
          `SELECT p.name, SUM(sp.quantity) as quantity, SUM(sp.quantity * sp.price) as total
       FROM sale_products sp
       JOIN products p ON sp.product_id = p.id
       JOIN sales s ON sp.sale_id = s.id
       WHERE (s.status IS NULL OR s.status != 'cancelled') AND s.created_at BETWEEN ? AND ?
       GROUP BY sp.product_id ORDER BY quantity DESC LIMIT 5`,
          [startDate, end],
        ),
        DATABASE.db.getAllAsync(
          `SELECT s.*, c.name as client_name 
           FROM sales s 
           LEFT JOIN clients c ON s.client_id = c.id 
           WHERE (s.status IS NULL OR s.status != 'cancelled') AND s.created_at BETWEEN ? AND ? 
           ORDER BY s.created_at DESC`,
          [startDate, end],
        ),
      ]);

    return {
      totalSales: (rowTotal as any)?.total || 0,
      totalPaid: (rowPaid as any)?.total || 0,
      totalDebt: (rowDebt as any)?.total || 0,
      salesCount: (rowCount as any)?.count || 0,
      salesByDay: (byDay || []) as any[],
      topProducts: (topProducts || []) as any[],
      sales: (salesRaw || []).map((s: any) => ({
        ...s,
        is_debt: Boolean(s.is_debt),
        created_at: new Date(s.created_at),
        debt_date: s.debt_date ? new Date(s.debt_date) : null,
        client: s.client_id
          ? {
              id: s.client_id,
              name: s.client_name,
            }
          : null,
      })),
    };
  },

  getSaleById: async (
    id: number,
  ): Promise<
    | (SaleType & { products: any[]; client: { id: number; name: string } })
    | null
  > => {
    const sale: any = await DATABASE.db.getFirstAsync(
      `SELECT 
        s.*,
        c.id as client_id,
        c.name as client_name
        FROM sales s
        LEFT JOIN clients c ON s.client_id = c.id
        WHERE s.id = ?`,
      [id],
    );
    if (!sale) return null;

    const products = await DATABASE.db.getAllAsync(
      `SELECT sp.*, p.name as product_name, p.image_url as product_image 
       FROM sale_products sp
       JOIN products p ON sp.product_id = p.id
       WHERE sp.sale_id = ?`,
      [id],
    );

    return {
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null,
      products,
      client: sale.client_id
        ? {
            id: sale.client_id,
            name: sale.client_name,
          }
        : null,
    };
  },

  updateSale: async (
    id: number,
    sale: Partial<SaleType> & {
      products?: { product_id: number; quantity: number; price: number }[];
    },
  ): Promise<void> => {
    await DATABASE.db.withTransactionAsync(async () => {
      // 1. Si viene la lista de productos, actualizar stock e ítems
      if (sale.products) {
        // a. Obtener productos previos de la venta
        const prevProducts: any[] = await DATABASE.db.getAllAsync(
          "SELECT product_id, quantity FROM sale_products WHERE sale_id = ?",
          [id],
        );

        // b. Devolver stock de productos previos
        for (const item of prevProducts) {
          await DATABASE.db.runAsync(
            "UPDATE products SET stock = stock + ? WHERE id = ?",
            [item.quantity, item.product_id],
          );
        }

        // c. Eliminar productos previos de la venta
        await DATABASE.db.runAsync(
          "DELETE FROM sale_products WHERE sale_id = ?",
          [id],
        );

        // d. Insertar nuevos productos de la venta y descontar del stock
        for (const prod of sale.products) {
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [id, prod.product_id, prod.quantity, prod.price],
          );

          await DATABASE.db.runAsync(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            [prod.quantity, prod.product_id],
          );
        }
      }

      // 2. Actualizar campos de la venta
      const fields: string[] = [];
      const values: any[] = [];

      if (sale.total !== undefined) {
        fields.push("total = ?");
        values.push(sale.total);
      }
      if (sale.note !== undefined) {
        fields.push("note = ?");
        values.push(sale.note);
      }
      if (sale.payment_method !== undefined) {
        fields.push("payment_method = ?");
        values.push(sale.payment_method);
      }
      if (sale.is_debt !== undefined) {
        fields.push("is_debt = ?");
        values.push(sale.is_debt ? 1 : 0);
      }
      if (sale.debt_amount !== undefined) {
        fields.push("debt_amount = ?");
        values.push(sale.debt_amount);
      }
      if (sale.debt_date !== undefined) {
        fields.push("debt_date = ?");
        values.push(
          sale.debt_date
            ? new Date(sale.debt_date).toISOString().split("T")[0]
            : null,
        );
      }
      if (sale.created_at !== undefined) {
        fields.push("created_at = ?");
        values.push(new Date(sale.created_at || "").toISOString().split("T")[0]);
      }
      if (sale.client_id !== undefined) {
        fields.push("client_id = ?");
        values.push(sale.client_id);
      }
      if (sale.edit_reason !== undefined) {
        fields.push("edit_reason = ?");
        values.push(sale.edit_reason);
      }

      if (fields.length > 0) {
        values.push(id);
        await DATABASE.db.runAsync(
          `UPDATE sales SET ${fields.join(", ")} WHERE id = ?`,
          values,
        );
      }
    });
  },

  deleteSale: async (id: number, cancelReason?: string): Promise<void> => {
    await DATABASE.db.withTransactionAsync(async () => {
      // 1. Obtener productos de la venta para devolverlos al stock
      const saleProducts: any[] = await DATABASE.db.getAllAsync(
        "SELECT product_id, quantity FROM sale_products WHERE sale_id = ?",
        [id],
      );

      // 2. Devolver stock de cada producto
      for (const item of saleProducts) {
        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.product_id],
        );
      }

      // 3. Marcar la venta como anulada/cancelada y guardar el motivo
      await DATABASE.db.runAsync(
        "UPDATE sales SET status = 'cancelled', cancel_reason = ? WHERE id = ?",
        [cancelReason || "", id],
      );
    });
  },

  getTodaySales: async (): Promise<SaleType[]> => {
    const todayStr = new Date().toISOString().split("T")[0];
    const sales = await DATABASE.db.getAllAsync(
      `SELECT s.*, c.name as client_name 
       FROM sales s 
       LEFT JOIN clients c ON s.client_id = c.id 
       WHERE s.created_at = ? AND (s.status IS NULL OR s.status != 'cancelled')`,
      [todayStr],
    );
    return sales.map((sale: any) => ({
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null,
      client: sale.client_id
        ? {
            id: sale.client_id,
            name: sale.client_name,
          }
        : null,
    }));
  },

  getDebtSales: async (): Promise<SaleType[]> => {
    const sales = await DATABASE.db.getAllAsync(
      `SELECT s.*, c.name as client_name 
       FROM sales s 
       LEFT JOIN clients c ON s.client_id = c.id 
       WHERE s.is_debt = 1 AND (s.status IS NULL OR s.status != 'cancelled') 
       ORDER BY s.created_at DESC`,
    );
    return sales.map((sale: any) => ({
      ...sale,
      is_debt: true,
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? new Date(sale.debt_date) : null,
      client: sale.client_id
        ? {
            id: sale.client_id,
            name: sale.client_name,
          }
        : null,
    }));
  },

  markSaleAsPaid: async (saleId: number): Promise<void> => {
    await DATABASE.db.runAsync(
      "UPDATE sales SET is_debt = 0, debt_amount = 0 WHERE id = ?",
      [saleId],
    );
  },

  createMany: async (sales: SaleType[]) => {
    const salesCount: { count: number } | null =
      await DATABASE.db.getFirstAsync("SELECT COUNT(*) as count FROM sales");

    console.log(salesCount?.count, typeof salesCount);

    if (salesCount?.count === 0) {
      await DATABASE.db.withTransactionAsync(async () => {
        for (const sale of sales) {
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              sale.id!,
              sale.total,
              sale.note || "",
              sale.is_debt ? 1 : 0,
              sale.debt_amount || null,
              sale.debt_date
                ? new Date(sale.debt_date).toISOString().split("T")[0]
                : null,
              new Date().toISOString().split("T")[0],
            ],
          );
        }
      });
    }
  },
};
