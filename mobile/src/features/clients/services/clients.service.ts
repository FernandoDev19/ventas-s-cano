import DATABASE from "@/src/core/config/db";
import { ClientType } from "../types/client.type";

export const ClientsService = {
  getAll: async (): Promise<ClientType[]> => {
    return await DATABASE.db.getAllAsync("SELECT * FROM clients ORDER BY name ASC") as ClientType[];
  },

  getById: async (id: number): Promise<ClientType | null> => {
    return await DATABASE.db.getFirstAsync("SELECT * FROM clients WHERE id = ?", [id]) as ClientType | null;
  },

  create: async (client: Omit<ClientType, "id">): Promise<ClientType> => {
    const result = await DATABASE.db.runAsync(
      "INSERT INTO clients (name, phone, notes) VALUES (?, ?, ?)",
      [client.name, client.phone || "", client.notes || ""]
    );
    return { id: result.lastInsertRowId, ...client };
  },

  update: async (id: number, client: Partial<Omit<ClientType, "id">>): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];
    if (client.name !== undefined) { fields.push("name = ?"); values.push(client.name); }
    if (client.phone !== undefined) { fields.push("phone = ?"); values.push(client.phone); }
    if (client.notes !== undefined) { fields.push("notes = ?"); values.push(client.notes); }
    if (!fields.length) return;
    values.push(id);
    await DATABASE.db.runAsync(`UPDATE clients SET ${fields.join(", ")} WHERE id = ?`, values);
  },

  delete: async (id: number): Promise<void> => {
    await DATABASE.db.runAsync("DELETE FROM clients WHERE id = ?", [id]);
  },

  // Clientes que tienen ventas fiadas pendientes
  getDebtors: async (): Promise<(ClientType & { totalDebt: number; salesCount: number })[]> => {
    return await DATABASE.db.getAllAsync(`
      SELECT c.*, 
             SUM(s.debt_amount) as totalDebt,
             COUNT(s.id) as salesCount
      FROM clients c
      JOIN sales s ON s.client_id = c.id
      WHERE s.is_debt = 1
      GROUP BY c.id
      ORDER BY totalDebt DESC
    `) as any[];
  },
};