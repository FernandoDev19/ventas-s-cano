import DATABASE from "@/src/core/config/db";
import { SaleType } from "../types/sale.type";
import { v4 as uuidv4 } from "uuid";
import { SyncService } from "@/src/shared/services/sync.service";
import { OrderPro } from "../../orders/types/order.type";
import {
  localRangeISO,
  parseLocalDate,
  toLocalDateStr,
} from "@/src/shared/helpers/date.helper";

const productCost = async (productId: string): Promise<number> => {
  const r: any = await DATABASE.db.getFirstAsync(
    "SELECT cost FROM products WHERE id = ?",
    [productId],
  );
  return Number(r?.cost) || 0;
};

const recipeCost = async (recipeId: string): Promise<number> => {
  const r: any = await DATABASE.db.getFirstAsync(
    `SELECT COALESCE(SUM(ri.quantity * p.cost), 0) AS c
       FROM recipe_ingredients ri JOIN products p ON p.id = ri.product_id
      WHERE ri.recipe_id = ? AND ri.deleted_at IS NULL`,
    [recipeId],
  );
  return Number(r?.c) || 0;
};

export const SalesService = {
  createSale: async (
    sale: Omit<SaleType, "id" | "created_at">,
    products: { product_id: string; quantity: number; price: number }[],
    recipes?: { recipe_id: string; quantity: number; price: number }[], // ✅ NUEVO
  ): Promise<SaleType> => {
    const createdAtStr = new Date().toISOString();
    const debtDateStr = sale.debt_date
      ? parseLocalDate(sale.debt_date).toISOString().split("T")[0]
      : null;

    const saleId = uuidv4();

    await DATABASE.db.withTransactionAsync(async () => {
      // Crear la venta
      await DATABASE.db.runAsync(
        "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, payment_method, client_id, sincronizado, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          saleId,
          sale.total,
          sale.note || "",
          sale.is_debt ? 1 : 0,
          sale.debt_amount || 0,
          debtDateStr,
          sale.payment_method || "cash",
          sale.client_id || null,
          0,
          new Date().toISOString(),
          createdAtStr,
        ],
      );

      // Guardar PRODUCTOS en sale_products
      for (const prod of products) {
        let prodId = uuidv4();
        await DATABASE.db.runAsync(
          "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, cost, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            prodId,
            saleId,
            prod.product_id,
            prod.quantity,
            prod.price,
            await productCost(prod.product_id),
            0,
            new Date().toISOString(),
          ],
        );
        // Deducir stock de productos
        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock - ?, sincronizado = 0, updated_at = ? WHERE id = ?",
          [prod.quantity, new Date().toISOString(), prod.product_id],
        );
      }

      // Guardar RECETAS en sale_recipes (separado!)
      if (recipes && recipes.length > 0) {
        for (const recipe of recipes) {
          let recipeId = uuidv4();
          await DATABASE.db.runAsync(
            "INSERT INTO sale_recipes (id, sale_id, recipe_id, quantity, price, cost, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              recipeId,
              saleId,
              recipe.recipe_id,
              recipe.quantity,
              recipe.price,
              await recipeCost(recipe.recipe_id),
              0,
              new Date().toISOString(),
            ],
          );
        }
      }
    });

    SyncService.run().catch((err) =>
      console.error("Error sincronizando al crear venta:", err),
    );

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

  crearVentaDesdeOrdenWeb: async (
    orden: OrderPro,
    tipoPago: "efectivo" | "transferencia" | "deuda",
  ): Promise<boolean> => {
    try {
      const hoy = new Date().toISOString();
      const debtDateStr = tipoPago === "deuda" ? hoy.split("T")[0] : null;
      const saleId = uuidv4();

      await DATABASE.db.withTransactionAsync(async () => {
        if (orden.client_id) {
          const clienteLocal = await DATABASE.db.getFirstAsync<{ id: string }>(
            "SELECT id FROM clients WHERE id = ?;",
            [orden.client_id],
          );

          if (!clienteLocal) {
            console.log(
              `🕵️‍♂️ Cliente nuevo de la web. Registrando en SQLite: ${orden.customer_name}`,
            );
            await DATABASE.db.runAsync(
              "INSERT INTO clients (id, name, phone, notes, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
              [
                orden.client_id,
                orden.customer_name,
                orden.customer_phone,
                orden.delivery_address || "Cliente de la Web",
                1,
                hoy,
              ],
            );
          }
        }

        // =================================================================
        // 💰 2. CREAR LA VENTA PRINCIPAL
        // =================================================================
        await DATABASE.db.runAsync(
          "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, payment_method, client_id, source_order_id, sincronizado, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            saleId,
            orden.total_price,
            orden.comments || "",
            tipoPago === "deuda" ? 1 : 0,
            tipoPago === "deuda" ? orden.total_price : 0,
            debtDateStr,
            tipoPago,
            orden.client_id || null,
            orden.id, // ← enlace con la orden
            0,
            hoy,
            hoy,
          ],
        );

        // =================================================================
        // 📦 3. DESGLOSAR ÍTEMS EN PRODUCTOS O RECETAS Y ACTUALIZAR STOCK
        // =================================================================
        for (const item of orden.order_items) {
          if (item.product_id) {
            // Es un producto individual
            await DATABASE.db.runAsync(
              "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, cost, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [uuidv4(), saleId, item.product_id, item.quantity, item.price_at_time,
              await productCost(item.product_id), 0, hoy],
            );

            // Deducir stock del producto local
            await DATABASE.db.runAsync(
              "UPDATE products SET stock = stock - ?, sincronizado = 0, updated_at = ? WHERE id = ?",
              [item.quantity, hoy, item.product_id],
            );
          } else if (item.recipe_id) {
            // Es una receta / combo especial
            const costoReceta = await recipeCost(item.recipe_id);

            await DATABASE.db.runAsync(
              "INSERT INTO sale_recipes (id, sale_id, recipe_id, quantity, price, cost, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [uuidv4(), saleId, item.recipe_id, item.quantity, item.price_at_time,
              await recipeCost(item.recipe_id), 0, hoy],
            );

            const ingredientes = await DATABASE.db.getAllAsync<{
              product_id: string;
              quantity: number;
            }>(
              "SELECT product_id, quantity FROM recipe_ingredients WHERE recipe_id = ? AND deleted_at IS NULL",
              [item.recipe_id],
            );

            for (const ing of ingredientes) {
              const cantidadATorcer = ing.quantity * item.quantity;

              await DATABASE.db.runAsync(
                "UPDATE products SET stock = stock - ?, sincronizado = 0, updated_at = ? WHERE id = ?",
                [cantidadATorcer, hoy, ing.product_id],
              );
            }
          }
        }
      });

      // Disparar la sincronización
      SyncService.run().catch((err) =>
        console.error("Error sincronizando al aceptar orden web:", err),
      );

      console.log(
        `✅ ¡Orden web integrada limpiamente en SQLite con ID: ${saleId}!`,
      );
      return true;
    } catch (error) {
      console.error("Error guardando la orden web en SQLite:", error);
      throw error;
    }
  },

  getSales: async (): Promise<SaleType[]> => {
    const sales = await DATABASE.db.getAllAsync(
      `SELECT s.*, c.name as client_name,
        (SELECT group_concat(sp.quantity || 'x ' || COALESCE(p.name,'Producto eliminado'), ', ')
          FROM sale_products sp LEFT JOIN products p ON p.id = sp.product_id
          WHERE sp.sale_id = s.id AND sp.deleted_at IS NULL) as products_summary,
        (SELECT group_concat(sr.quantity || 'x ' || COALESCE(r.name,'Receta eliminada'), ', ')
          FROM sale_recipes sr LEFT JOIN recipes r ON r.id = sr.recipe_id
          WHERE sr.sale_id = s.id AND sr.deleted_at IS NULL) as recipes_summary,
        (SELECT COALESCE(SUM(quantity),0) FROM sale_products WHERE sale_id = s.id AND deleted_at IS NULL)
        + (SELECT COALESCE(SUM(quantity),0) FROM sale_recipes WHERE sale_id = s.id AND deleted_at IS NULL) as items_count
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
      WHERE (s.status IS NULL OR s.status != 'cancelled') AND s.deleted_at IS NULL
       ORDER BY s.created_at DESC`,
    );

    return sales.map((sale: any) => ({
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? parseLocalDate(sale.debt_date) : null,
      items_summary: [sale.products_summary, sale.recipes_summary]
        .filter(Boolean)
        .join(", "),
      client: sale.client_id
        ? { id: sale.client_id, name: sale.client_name }
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
      debt_date: sale.debt_date ? parseLocalDate(sale.debt_date) : null,
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
    allProducts: { name: string; quantity: number; total: number }[];
    totalUnits: number;
    salesByDay: { dateStr: string; total: number; count: number }[];
    topProducts: { name: string; quantity: number; total: number }[];
    sales: SaleType[];
  }> => {
    const { startISO, endISO } = localRangeISO(startDate, endDate);

    const [rowTotal, rowPaid, rowDebt, rowCount, topProducts, salesRaw] =
      await Promise.all([
        DATABASE.db.getFirstAsync(
          "SELECT SUM(total) as total FROM sales WHERE (status IS NULL OR status != 'cancelled') AND deleted_at IS NULL AND created_at BETWEEN ? AND ?",
          [startISO, endISO],
        ),
        DATABASE.db.getFirstAsync(
          "SELECT SUM(total) as total FROM sales WHERE is_debt = 0 AND (status IS NULL OR status != 'cancelled') AND deleted_at IS NULL AND created_at BETWEEN ? AND ?",
          [startISO, endISO],
        ),
        DATABASE.db.getFirstAsync(
          "SELECT SUM(debt_amount) as total FROM sales WHERE is_debt = 1 AND (status IS NULL OR status != 'cancelled') AND deleted_at IS NULL AND created_at BETWEEN ? AND ?",
          [startISO, endISO],
        ),
        DATABASE.db.getFirstAsync(
          "SELECT COUNT(*) as count FROM sales WHERE (status IS NULL OR status != 'cancelled') AND deleted_at IS NULL AND created_at BETWEEN ? AND ?",
          [startISO, endISO],
        ),
        DATABASE.db.getAllAsync(
          `SELECT name, SUM(quantity) AS quantity, SUM(total) AS total FROM (
            SELECT COALESCE(p.name,'Producto eliminado') AS name, sp.quantity AS quantity, sp.quantity * sp.price AS total
              FROM sale_products sp
              LEFT JOIN products p ON p.id = sp.product_id
              JOIN sales s ON s.id = sp.sale_id
              WHERE (s.status IS NULL OR s.status != 'cancelled') AND s.deleted_at IS NULL
                AND sp.deleted_at IS NULL
                AND s.created_at BETWEEN ? AND ?
            UNION ALL
            SELECT COALESCE(r.name,'Receta eliminada') || ' (receta)', sr.quantity, sr.quantity * sr.price
              FROM sale_recipes sr
              LEFT JOIN recipes r ON r.id = sr.recipe_id
              JOIN sales s ON s.id = sr.sale_id
              WHERE (s.status IS NULL OR s.status != 'cancelled') AND s.deleted_at IS NULL
                AND sr.deleted_at IS NULL
                AND s.created_at BETWEEN ? AND ?
          ) GROUP BY name ORDER BY quantity DESC`,
          [startISO, endISO, startISO, endISO],
        ),
        DATABASE.db.getAllAsync(
          `SELECT s.*, c.name as client_name 
           FROM sales s 
           LEFT JOIN clients c ON s.client_id = c.id 
           WHERE (s.status IS NULL OR s.status != 'cancelled') AND s.deleted_at IS NULL AND s.created_at BETWEEN ? AND ? 
           ORDER BY s.created_at DESC`,
          [startISO, endISO],
        ),
      ]);

    const map = new Map<
      string,
      { dateStr: string; total: number; count: number }
    >();
    for (const s of salesRaw as any[]) {
      const d = toLocalDateStr(s.created_at);
      const e = map.get(d) ?? { dateStr: d, total: 0, count: 0 };
      e.total += s.total;
      e.count += 1;
      map.set(d, e);
    }
    const salesByDay = [...map.values()].sort((a, b) =>
      a.dateStr.localeCompare(b.dateStr),
    );
    const allItems = (topProducts || []) as any[];

    return {
      totalSales: (rowTotal as any)?.total || 0,
      totalPaid: (rowPaid as any)?.total || 0,
      totalDebt: (rowDebt as any)?.total || 0,
      salesCount: (rowCount as any)?.count || 0,
      salesByDay: (salesByDay || []) as any[],
      topProducts: allItems.slice(0, 5),
      allProducts: allItems,
      totalUnits: allItems.reduce((sum, p) => sum + Number(p.quantity), 0),
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
    id: string,
  ): Promise<
    | (SaleType & {
      products: any[];
      recipes: any[];
      client: { id: string; name: string; phone?: string | null } | null;
    })
    | null
  > => {
    const sale: any = await DATABASE.db.getFirstAsync(
      `SELECT 
        s.*,
        c.id as client_id,
        c.name as client_name,
        c.phone as client_phone
        FROM sales s
        LEFT JOIN clients c ON s.client_id = c.id
        WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id],
    );

    if (!sale) return null;

    // Obtener productos vendidos
    const products = await DATABASE.db.getAllAsync(
      `SELECT sp.*, COALESCE(p.name,'Producto eliminado') as product_name, p.image_url as product_image
        FROM sale_products sp LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.sale_id = ? AND sp.deleted_at IS NULL`,
      [id],
    );

    // Obtener recetas vendidas
    const recipes = await DATABASE.db.getAllAsync(
      `SELECT sr.*, COALESCE(r.name,'Receta eliminada') as recipe_name, r.image_url as recipe_image
        FROM sale_recipes sr LEFT JOIN recipes r ON sr.recipe_id = r.id
        WHERE sr.sale_id = ? AND sr.deleted_at IS NULL`,
      [id],
    );

    return {
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? parseLocalDate(sale.debt_date) : null,
      products,
      recipes,
      client: sale.client_id
        ? {
          id: sale.client_id,
          name: sale.client_name,
          phone: sale.client_phone,
        }
        : null,
    };
  },

  getProfitDetail: async (startDate: string, endDate: string) => {
    const { startISO, endISO } = localRangeISO(startDate, endDate);
    const rows: any[] = await DATABASE.db.getAllAsync(
      `SELECT s.created_at, sp.product_id AS item_id, COALESCE(p.name,'Producto eliminado') AS name, 0 AS is_recipe,
            sp.quantity AS qty, sp.quantity * sp.price AS revenue, sp.quantity * sp.cost AS cost
       FROM sale_products sp
       LEFT JOIN products p ON p.id = sp.product_id
       JOIN sales s ON s.id = sp.sale_id
      WHERE (s.status IS NULL OR s.status != 'cancelled') AND s.deleted_at IS NULL
        AND sp.deleted_at IS NULL AND s.created_at BETWEEN ? AND ?
     UNION ALL
     SELECT s.created_at, sr.recipe_id, COALESCE(r.name,'Receta eliminada'), 1, sr.quantity, sr.quantity * sr.price, sr.quantity * sr.cost
       FROM sale_recipes sr
       LEFT JOIN recipes r ON r.id = sr.recipe_id
       JOIN sales s ON s.id = sr.sale_id
      WHERE (s.status IS NULL OR s.status != 'cancelled') AND s.deleted_at IS NULL
        AND sr.deleted_at IS NULL AND s.created_at BETWEEN ? AND ?`,
      [startISO, endISO, startISO, endISO],
    );

    const map = new Map<string, any>();
    const costByDay: Record<string, number> = {};
    let totalCost = 0,
      uncostedRevenue = 0;

    for (const r of rows) {
      const key = `${r.is_recipe}-${r.item_id}`;
      const e = map.get(key) ?? {
        name: r.is_recipe ? `${r.name} (receta)` : r.name,
        quantity: 0,
        revenue: 0,
        cost: 0,
      };
      e.quantity += r.qty;
      e.revenue += r.revenue;
      e.cost += r.cost;
      map.set(key, e);
      totalCost += r.cost;
      if (!r.cost) uncostedRevenue += r.revenue; // vendido sin costo cargado
      const d = toLocalDateStr(r.created_at);
      costByDay[d] = (costByDay[d] ?? 0) + r.cost;
    }

    const products = [...map.values()]
      .map((p) => ({
        ...p,
        profit: p.revenue - p.cost,
        margin: p.revenue ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);

    return { totalCost, uncostedRevenue, products, costByDay };
  },

  updateSale: async (
    id: string,
    sale: Partial<SaleType> & {
      products?: { product_id: string; quantity: number; price: number }[];
      recipes?: { recipe_id: string; quantity: number; price: number }[]; // ✅ NUEVO
    },
  ): Promise<void> => {
    await DATABASE.db.withTransactionAsync(async () => {
      const now = new Date().toISOString();
      // ✅ 1. Si vienen productos, actualizar stock
      if (sale.products) {
        const prevProducts: any[] = await DATABASE.db.getAllAsync(
          "SELECT product_id, quantity, cost FROM sale_products WHERE sale_id = ? AND deleted_at IS NULL",
          [id],
        );

        // Guardamos los costos históricos en un mapa: { product_id: cost }
        const prevProductCosts = new Map<string, number>();
        for (const item of prevProducts) {
          prevProductCosts.set(item.product_id, item.cost);

          await DATABASE.db.runAsync(
            "UPDATE products SET stock = stock + ?, sincronizado = 0, updated_at = ? WHERE id = ?",
            [item.quantity, now, item.product_id],
          );
        }

        await DATABASE.db.runAsync(
          "UPDATE sale_products SET deleted_at = ?, sincronizado = 0, updated_at = ? WHERE sale_id = ? AND deleted_at IS NULL",
          [now, now, id],
        );

        // Insertar productos
        for (const prod of sale.products) {
          let prodId = uuidv4();
          // Si ya existía en esta venta, usa su costo guardado; si es nuevo, calcula el actual
          const finalCost = prevProductCosts.has(prod.product_id)
            ? prevProductCosts.get(prod.product_id)!
            : await productCost(prod.product_id);

          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, cost, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              prodId,
              id,
              prod.product_id,
              prod.quantity,
              prod.price,
              finalCost,
              0,
              new Date().toISOString(),
            ],
          );

          // Deducir nuevo stock
          await DATABASE.db.runAsync(
            "UPDATE products SET stock = stock - ?, sincronizado = 0, updated_at = ? WHERE id = ?",
            [prod.quantity, new Date().toISOString(), prod.product_id],
          );
        }
      }

      // ✅ 2. Si vienen recetas, actualizar sale_recipes y conservar costo histórico
      if (sale.recipes) {
        const prevRecipes: any[] = await DATABASE.db.getAllAsync(
          "SELECT recipe_id, cost FROM sale_recipes WHERE sale_id = ? AND deleted_at IS NULL",
          [id],
        );

        const prevRecipeCosts = new Map<string, number>();
        for (const item of prevRecipes) {
          prevRecipeCosts.set(item.recipe_id, item.cost);
        }

        // Eliminar recetas previas
        await DATABASE.db.runAsync(
          "UPDATE sale_recipes SET deleted_at = ?, sincronizado = 0, updated_at = ? WHERE sale_id = ? AND deleted_at IS NULL",
          [now, now, id],
        );

        // Insertar recetas
        for (const recipe of sale.recipes) {
          let recipeId = uuidv4();
          const finalCost = prevRecipeCosts.has(recipe.recipe_id)
            ? prevRecipeCosts.get(recipe.recipe_id)!
            : await recipeCost(recipe.recipe_id); // <-- Ajusta el nombre si tu helper de recetas se llama distinto

          await DATABASE.db.runAsync(
            "INSERT INTO sale_recipes (id, sale_id, recipe_id, quantity, price, cost, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              recipeId,
              id,
              recipe.recipe_id,
              recipe.quantity,
              recipe.price,
              finalCost,
              0,
              new Date().toISOString(),
            ],
          );
        }
      }
      // ✅ 3. Actualizar campos de la venta
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
            ? parseLocalDate(sale.debt_date).toISOString().split("T")[0]
            : null,
        );
      }
      if (sale.created_at !== undefined) {
        fields.push("created_at = ?");
        values.push(
          new Date(sale.created_at || "").toISOString().split("T")[0],
        );
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
        values.push(new Date().toISOString());
        values.push(id);
        await DATABASE.db.runAsync(
          `UPDATE sales SET ${fields.join(", ")}, sincronizado = 0, updated_at = ? WHERE id = ?`,
          values,
        );
      }
    });

    SyncService.run().catch((err) =>
      console.error("Error sincronizando al actualizar venta:", err),
    );
  },

  deleteSale: async (id: string, cancelReason?: string): Promise<void> => {
    await DATABASE.db.withTransactionAsync(async () => {
      const now = new Date().toISOString();

      // Obtener productos para devolverlos al stock
      const saleProducts: any[] = await DATABASE.db.getAllAsync(
        "SELECT product_id, quantity FROM sale_products WHERE sale_id = ? AND deleted_at IS NULL", // ← faltaba el filtro
        [id],
      );

      // Devolver stock de cada producto
      for (const item of saleProducts) {
        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock + ?, sincronizado = 0, updated_at = ? WHERE id = ?",
          [item.quantity, now, item.product_id],
        );
      }
      // ✅ Eliminar registros de recetas (no se devuelven ingredientes al eliminar venta completa)
      await DATABASE.db.runAsync(
        "UPDATE sale_recipes SET deleted_at = ?, sincronizado = 0, updated_at = ? WHERE sale_id = ? AND deleted_at IS NULL",
        [now, now, id],
      );

      // Marcar la venta como anulada
      await DATABASE.db.runAsync(
        "UPDATE sales SET status = 'cancelled', cancel_reason = ?, sincronizado = 0, updated_at = ? WHERE id = ?",
        [cancelReason || "", now, id],
      );
    });

    SyncService.run().catch((err) =>
      console.error("Error sincronizando al borrar/anular venta:", err),
    );
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
      debt_date: sale.debt_date ? parseLocalDate(sale.debt_date) : null,
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
      debt_date: sale.debt_date ? parseLocalDate(sale.debt_date) : null,
      client: sale.client_id
        ? {
          id: sale.client_id,
          name: sale.client_name,
        }
        : null,
    }));
  },

  markSaleAsPaid: async (saleId: string): Promise<void> => {
    await DATABASE.db.runAsync(
      "UPDATE sales SET is_debt = 0, debt_amount = 0, sincronizado = 0, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), saleId],
    );

    SyncService.run().catch((err) =>
      console.error("Error sincronizando al marcar como pagada:", err),
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
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, sincronizado, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              sale.id!,
              sale.total,
              sale.note || "",
              sale.is_debt ? 1 : 0,
              sale.debt_amount || null,
              sale.debt_date
                ? parseLocalDate(sale.debt_date).toISOString().split("T")[0]
                : null,
              0,
              new Date().toISOString(),
              new Date().toISOString().split("T")[0],
            ],
          );
        }
      });
    }
  },

  linkToOrder: async (saleId: string, orderId: string): Promise<void> => {
    await DATABASE.db.runAsync(
      "UPDATE sales SET source_order_id = ?, sincronizado = 0, updated_at = ? WHERE id = ?",
      [orderId, new Date().toISOString(), saleId],
    );

    SyncService.run().catch((err) =>
      console.error("Error sincronizando enlace venta-orden:", err),
    );
  },

  /** Busca la venta local enlazada a una orden (por source_order_id) */
  getBySourceOrderId: async (orderId: string): Promise<SaleType | null> => {
    const sale: any = await DATABASE.db.getFirstAsync(
      "SELECT * FROM sales WHERE source_order_id = ? AND (status IS NULL OR status != 'cancelled') LIMIT 1",
      [orderId],
    );
    if (!sale) return null;
    return {
      ...sale,
      is_debt: Boolean(sale.is_debt),
      created_at: new Date(sale.created_at),
      debt_date: sale.debt_date ? parseLocalDate(sale.debt_date) : null,
    };
  },

  /** Cancela (revierte stock) la venta enlazada a una orden, si existe */
  cancelBySourceOrderId: async (
    orderId: string,
    cancelReason: string,
  ): Promise<boolean> => {
    const sale = await SalesService.getBySourceOrderId(orderId);
    if (!sale?.id) return false;
    await SalesService.deleteSale(sale.id, cancelReason);
    return true;
  },
};
