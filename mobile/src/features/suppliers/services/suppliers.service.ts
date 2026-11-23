import DATABASE from "@/src/core/config/db";
import { SyncService } from "@/src/shared/services/sync.service";
import { v4 as uuidv4 } from "uuid";
import { SupplierForm, SupplierType } from "../types/supplier.type";

const sync = (label: string) =>
  SyncService.run().catch((e) => console.error(`Error sincronizando ${label}:`, e));

export const SuppliersService = {
  getAll: async (): Promise<SupplierType[]> =>
    (await DATABASE.db.getAllAsync(
      "SELECT * FROM suppliers WHERE deleted_at IS NULL ORDER BY name ASC",
    )) as SupplierType[],

  create: async (s: SupplierForm): Promise<SupplierType> => {
    const id = uuidv4();
    const now = new Date().toISOString();
    await DATABASE.db.runAsync(
      `INSERT INTO suppliers (id, name, contact_name, phone, products_supplied, payment_terms_days, notes, sincronizado, updated_at)
       VALUES (?,?,?,?,?,?,?,0,?)`,
      [id, s.name, s.contact_name || "", s.phone || "", s.products_supplied || "",
       s.payment_terms_days ?? 0, s.notes || "", now],
    );
    sync("proveedor");
    return { id, ...s, updated_at: now };
  },

  update: async (id: string, s: SupplierForm): Promise<void> => {
    await DATABASE.db.runAsync(
      `UPDATE suppliers SET name=?, contact_name=?, phone=?, products_supplied=?,
         payment_terms_days=?, notes=?, sincronizado=0, updated_at=? WHERE id=?`,
      [s.name, s.contact_name || "", s.phone || "", s.products_supplied || "",
       s.payment_terms_days ?? 0, s.notes || "", new Date().toISOString(), id],
    );
    sync("proveedor");
  },

  delete: async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    await DATABASE.db.runAsync(
      "UPDATE suppliers SET sincronizado=0, updated_at=?, deleted_at=? WHERE id=?",
      [now, now, id],
    );
    sync("proveedor");
  },

  /** Lo que se le debe a cada proveedor (gastos con is_paid = 0) */
  getPayableTotals: async (): Promise<Record<string, number>> => {
    const rows: any[] = await DATABASE.db.getAllAsync(
      `SELECT supplier_id, SUM(amount) AS total FROM expenses
        WHERE is_paid = 0 AND deleted_at IS NULL AND supplier_id IS NOT NULL
        GROUP BY supplier_id`,
    );
    return Object.fromEntries(rows.map((r) => [r.supplier_id, r.total]));
  },
};