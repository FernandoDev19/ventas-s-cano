import DATABASE from "./db";
import { v4 as uuidv4 } from "uuid";
import { DEMO_MODE } from "./app.config";

const dayISO = (daysAgo: number, hour = 13) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

/**
 * Ventas y gastos de ejemplo en SQLite (esas tablas no se bajan de la nube en el sync).
 * Solo corre en modo demo y si no hay ventas aún.
 */
export async function seedLocalDemoData() {
  if (!DEMO_MODE) return;
  const count: any = await DATABASE.db.getFirstAsync("SELECT COUNT(*) as count FROM sales");
  if (count?.count > 0) return;

  const products: any[] = await DATABASE.db.getAllAsync("SELECT id, price FROM products WHERE deleted_at IS NULL");
  const cats: any[] = await DATABASE.db.getAllAsync("SELECT id FROM categories WHERE deleted_at IS NULL");
  if (!products.length) return;

  await DATABASE.db.withTransactionAsync(async () => {
    for (let d = 0; d < 14; d++) {
      const perDay = 2 + (d % 4);
      for (let i = 0; i < perDay; i++) {
        const saleId = uuidv4();
        const items = [products[(d + i) % products.length], products[(d + i + 2) % products.length]];
        const total = items.reduce((s, p) => s + p.price, 0);
        const isDebt = d < 3 && i === 0 ? 1 : 0;
        const at = dayISO(d, 12 + i * 2);
        await DATABASE.db.runAsync(
          `INSERT INTO sales (id,total,note,is_debt,debt_amount,debt_date,payment_method,created_at,client_id,status,sincronizado,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [saleId, total, "", isDebt, isDebt ? total : 0, isDebt ? dayISO(-5).split("T")[0] : null,
           isDebt ? "deuda" : i % 2 ? "transferencia" : "efectivo", at,
           isDebt ? "demo-client-1" : null, "active", 1, at],
        );
        for (const p of items)
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (id,sale_id,product_id,quantity,price,sincronizado,updated_at) VALUES (?,?,?,?,?,?,?)",
            [uuidv4(), saleId, p.id, 1, p.price, 1, at],
          );
      }
    }
    for (let d = 0; d < 6; d++) {
      const at = dayISO(d * 2).split("T")[0];
      await DATABASE.db.runAsync(
        "INSERT INTO expenses (id,description,category_id,amount,date,notes,sincronizado,updated_at) VALUES (?,?,?,?,?,?,?,?)",
        [uuidv4(), d % 2 ? "Gas / servicios" : "Compra de insumos", cats[d % cats.length]?.id ?? null,
         25000 + d * 8000, at, "", 1, new Date().toISOString()],
      );
    }
  });
}