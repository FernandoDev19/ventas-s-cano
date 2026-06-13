import DATABASE from "@/src/core/config/db";
import { ClientType } from "../types/client.type";
import { v4 as uuidv4 } from 'uuid';
import { SyncService } from "@/src/shared/services/sync.service";

export const ClientsService = {
  getAll: async (): Promise<ClientType[]> => {
    return await DATABASE.db.getAllAsync("SELECT * FROM clients WHERE deleted_at IS NULL ORDER BY name ASC") as ClientType[];
  },

  getById: async (id: number): Promise<ClientType | null> => {
    return await DATABASE.db.getFirstAsync("SELECT * FROM clients WHERE id = ? AND deleted_at IS NULL", [id]) as ClientType | null;
  },

  create: async (client: Omit<ClientType, "id">): Promise<ClientType> => {
    const id = uuidv4();
    await DATABASE.db.runAsync(
      "INSERT INTO clients (id, name, phone, notes, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, client.name, client.phone || "", client.notes || "", client.sincronizado || 0, client.updated_at || new Date().toISOString()]
    );
    return { id, ...client };
  },

  update: async (id: string, client: Partial<Omit<ClientType, "id">>): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];
    if (client.name !== undefined) { fields.push("name = ?"); values.push(client.name); }
    if (client.phone !== undefined) { fields.push("phone = ?"); values.push(client.phone); }
    if (client.notes !== undefined) { fields.push("notes = ?"); values.push(client.notes); }
    if (!fields.length) return;
    values.push(new Date().toISOString());
    values.push(id);
    await DATABASE.db.runAsync(`UPDATE clients SET ${fields.join(", ")}, sincronizado = 0, updated_at = ? WHERE id = ?`, values);
  },

  delete: async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    await DATABASE.db.runAsync("UPDATE clients SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE id = ?", [
      now,
      now,
      id,
    ]);

    SyncService.run().catch(err => console.error("Error sincronizando cliente:", err));
  },

  // Clientes que tienen ventas fiadas pendientes
  getDebtors: async (): Promise<(ClientType & { totalDebt: number; salesCount: number })[]> => {
    return await DATABASE.db.getAllAsync(`
      SELECT c.*, 
             SUM(s.debt_amount) as totalDebt,
             COUNT(s.id) as salesCount
      FROM clients c
      JOIN sales s ON s.client_id = c.id
      WHERE s.is_debt = 1 AND c.deleted_at IS NULL AND s.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY totalDebt DESC
    `) as any[];
  },
};