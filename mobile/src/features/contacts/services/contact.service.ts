import DATABASE from "@/src/core/config/db";
import { ContactType } from "../types/contact.type";
import { v4 as uuidv4 } from "uuid";
import { SyncService } from "@/src/shared/services/sync.service";

export const ContactsService = {
  getAll: async (): Promise<ContactType[]> => {
    return (await DATABASE.db.getAllAsync(
      "SELECT * FROM contacts WHERE deleted_at IS NULL ORDER BY name ASC",
    )) as ContactType[];
  },

  getClients: async (): Promise<ContactType[]> => {
    return (await DATABASE.db.getAllAsync(
      "SELECT * FROM contacts WHERE type = 'cliente' AND deleted_at IS NULL ORDER BY name ASC",
    )) as ContactType[];
  },

  getProviders: async (): Promise<ContactType[]> => {
    return (await DATABASE.db.getAllAsync(
      "SELECT * FROM contacts WHERE type = 'proveedor' AND deleted_at IS NULL ORDER BY name ASC",
    )) as ContactType[];
  },

  getById: async (id: number): Promise<ContactType | null> => {
    return (await DATABASE.db.getFirstAsync(
      "SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL",
      [id],
    )) as ContactType | null;
  },

  create: async (client: Omit<ContactType, "id">): Promise<ContactType> => {
    const id = uuidv4();
    await DATABASE.db.runAsync(
      "INSERT INTO contacts (id, name, phone, email, type, notes, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        client.name?.trim(),
        client.phone?.trim() || "",
        client.email?.trim() || "",
        client.type,
        client.notes?.trim() || "",
        client.sincronizado || 0,
        client.updated_at || new Date().toISOString(),
      ],
    );
    return { id, ...client };
  },

  update: async (
    id: string,
    client: Partial<Omit<ContactType, "id">>,
  ): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];
    if (client.name !== undefined) {
      fields.push("name = ?");
      values.push(client.name);
    }
    if (client.phone !== undefined) {
      fields.push("phone = ?");
      values.push(client.phone);
    }
    if (client.email !== undefined) {
      fields.push("email = ?");
      values.push(client.email);
    }
    if (client.type !== undefined) {
      fields.push("type = ?");
      values.push(client.type);
    }
    if (client.notes !== undefined) {
      fields.push("notes = ?");
      values.push(client.notes);
    }
    if (!fields.length) return;
    values.push(new Date().toISOString());
    values.push(id);
    await DATABASE.db.runAsync(
      `UPDATE contacts SET ${fields.join(", ")}, sincronizado = 0, updated_at = ? WHERE id = ?`,
      values,
    );
  },

  delete: async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    await DATABASE.db.runAsync(
      "UPDATE contacts SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE id = ?",
      [now, now, id],
    );

    SyncService.run().catch((err) =>
      console.error("Error sincronizando cliente:", err),
    );
  },

  // Clientes que tienen ventas fiadas pendientes
  getDebtors: async (): Promise<
    (ContactType & { totalDebt: number; salesCount: number })[]
  > => {
    return (await DATABASE.db.getAllAsync(`
      SELECT c.*, 
             SUM(s.debt_amount) as totalDebt,
             COUNT(s.id) as salesCount
      FROM contacts c
      JOIN sales s ON s.client_id = c.id
      WHERE s.is_debt = 1 AND c.type = 'cliente' AND c.deleted_at IS NULL AND s.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY totalDebt DESC
    `)) as any[];
  },
};
