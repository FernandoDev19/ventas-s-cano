import DATABASE from "@/src/core/config/db";
import { supabase } from "@/src/core/config/supabase";
import { SyncService } from "@/src/shared/services/sync.service";

export type TableStatus = "libre" | "ocupada" | "esperando_cuenta" | "por_cobrar";

export type TableType = {
  id: number;
  number_mesa: number;
  status: TableStatus;
  created_at?: string;
};

export const TablesService = {
  // ─── LECTURA ──────────────────────────────────────────
  getAll: async (): Promise<TableType[]> => {
    return (await DATABASE.db.getAllAsync(
      "SELECT id, number_mesa, status, created_at FROM tables ORDER BY number_mesa ASC"
    )) as TableType[];
  },

  getById: async (id: number): Promise<TableType | null> => {
    return (await DATABASE.db.getFirstAsync(
      "SELECT id, number_mesa, status, created_at FROM tables WHERE id = ?",
      [id]
    )) as TableType | null;
  },

  getByNumber: async (number: number): Promise<TableType | null> => {
    return (await DATABASE.db.getFirstAsync(
      "SELECT id, number_mesa, status, created_at FROM tables WHERE number_mesa = ?",
      [number]
    )) as TableType | null;
  },

  // ─── CAMBIAR ESTADO ───────────────────────────────────
  // Ocupar mesa (cuando cliente llega)
  occupy: async (id: number): Promise<void> => {
    try {
      const now = new Date().toISOString();
      await DATABASE.db.runAsync(
        "UPDATE tables SET status = 'ocupada', sincronizado = 0, updated_at = ? WHERE id = ? AND status = 'libre'",
        [now, id]
      );

      // Disparar sincronización en background
      SyncService.run().catch((err) =>
        console.error("Error sincronizando mesa ocupada:", err)
      );
    } catch (err) {
      console.error("Error ocupando mesa:", err);
      throw err;
    }
  },

  // Liberar mesa (cuando cliente se va / paga)
  release: async (id: number): Promise<void> => {
    try {
      const now = new Date().toISOString();
      await DATABASE.db.runAsync(
        "UPDATE tables SET status = 'libre', sincronizado = 0, updated_at = ? WHERE id = ?",
        [now, id]
      );

      // Disparar sincronización en background
      SyncService.run().catch((err) =>
        console.error("Error sincronizando mesa liberada:", err)
      );
    } catch (err) {
      console.error("Error liberando mesa:", err);
      throw err;
    }
  },

  // ─── ESTADÍSTICAS ─────────────────────────────────────
  getStats: async (): Promise<{
    total: number;
    libres: number;
    ocupadas: number;
  }> => {
    const all = await TablesService.getAll();

    return {
      total: all.length,
      libres: all.filter((t) => t.status === "libre").length,
      ocupadas: all.filter((t) => t.status === "ocupada").length,
    };
  },

  // ─── CONTAR ÓRDENES ACTIVAS POR MESA ─────────────────
  getActiveOrdersForTable: async (tableId: number): Promise<any[]> => {
    return (await DATABASE.db.getAllAsync(
      `SELECT o.* FROM orders o 
       WHERE o.table_id = ? AND o.status IN ('pending', 'accepted')
       ORDER BY o.created_at DESC`,
      [tableId]
    )) as any[];
  },

  // ─── SINCRONIZACIÓN CON SUPABASE ──────────────────────

  /**
   * Trae todos los cambios desde Supabase y los merge con la BD local
   * Aplica Last-Write-Wins basado en updated_at
   */
  syncFromCloud: async (): Promise<void> => {
    try {
      console.log("📥 [Tables] Descargando cambios desde Supabase...");

      const { data: cloudTables, error } = await supabase
        .from("tables")
        .select("id, number_mesa, status, created_at");

      if (error) throw error;
      if (!cloudTables || cloudTables.length === 0) {
        console.log("ℹ️ [Tables] No hay cambios en la nube");
        return;
      }

      // Procesar cada mesa desde la nube
      for (const cloudTable of cloudTables) {
        const localTable = await TablesService.getById(cloudTable.id);

        if (!localTable) {
          // Nueva mesa desde la nube → Insertar
          console.log(`✅ [Tables] Insertando mesa nueva: ${cloudTable.number_mesa}`);
          await DATABASE.db.runAsync(
            `INSERT INTO tables (id, number_mesa, status, created_at, sincronizado, updated_at)
             VALUES (?, ?, ?, ?, 1, ?)`,
            [
              cloudTable.id,
              cloudTable.number_mesa,
              cloudTable.status,
              cloudTable.created_at,
              new Date().toISOString(),
            ]
          );
        } else {
          // Ya existe → Comparar timestamps (Last-Write-Wins)
          const cloudUpdated = new Date(cloudTable.created_at || 0);
          const localUpdated = new Date(localTable.created_at || 0);

          if (cloudUpdated > localUpdated) {
            // Cloud es más reciente → Actualizar con datos de la nube
            console.log(
              `🔄 [Tables] Actualizando mesa ${cloudTable.number_mesa} desde nube`
            );
            await DATABASE.db.runAsync(
              `UPDATE tables SET status = ?, created_at = ?, sincronizado = 1, updated_at = ?
               WHERE id = ?`,
              [
                cloudTable.status,
                cloudTable.created_at,
                new Date().toISOString(),
                cloudTable.id,
              ]
            );
          } else {
            // Local es más reciente o igual → Mantener local sincronizado para push
            console.log(
              `✓ [Tables] Mesa ${cloudTable.number_mesa} local es más nueva, conservando`
            );
          }
        }
      }

      console.log("✅ [Tables] Sincronización descarga completada");
    } catch (err) {
      console.error("❌ [Tables] Error sincronizando desde nube:", err);
      throw err;
    }
  },

  /**
   * Pushea cambios locales (sincronizado=0) a Supabase
   */
  pushToCloud: async (): Promise<void> => {
    try {
      // Obtener todas las mesas pendientes de sincronizar
      const pendingTables: any[] = await DATABASE.db.getAllAsync(
        `SELECT id, number_mesa, status, created_at FROM tables WHERE sincronizado = 0`
      );

      if (pendingTables.length === 0) {
        console.log("ℹ️ [Tables] Nada que pushear a la nube");
        return;
      }

      console.log(`📤 [Tables] Pusheando ${pendingTables.length} cambios...`);

      // Hacer upsert de todos los cambios
      const { error: upsertError } = await supabase
        .from("tables")
        .upsert(
          pendingTables.map((t) => ({
            id: t.id,
            number_mesa: t.number_mesa,
            status: t.status,
            created_at: t.created_at,
          }))
        );

      if (upsertError) throw upsertError;

      // Marcar como sincronizadas
      await DATABASE.db.runAsync(
        `UPDATE tables SET sincronizado = 1 WHERE sincronizado = 0`
      );

      console.log("✅ [Tables] Push completado exitosamente");
    } catch (err) {
      console.error("❌ [Tables] Error pusheando a nube:", err);
      throw err;
    }
  },
};
