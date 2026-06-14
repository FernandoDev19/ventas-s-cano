import DATABASE from "@/src/core/config/db";
import { supabase } from "@/src/core/config/supabase";
import NetInfo from "@react-native-community/netinfo";

export const SyncService = {
  /**
   * Ejecuta la sincronización completa de todas las tablas hacia la nube
   */
  run: async () => {
    try {
      // 1. Verificar si hay internet
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        console.log("Sincronización cancelada: Sin conexión a internet.");
        return;
      }

      console.log("Iniciando sincronización con Supabase...");

      // 2. Sincronizar en orden de dependencias (Primero tablas padres, luego hijos)
      await SyncService.syncTable("categories");
      await SyncService.syncTable("products");
      await SyncService.syncTable("clients");
      await SyncService.syncTable("recipes");
      await SyncService.syncTable("sales");
      await SyncService.syncTable("sale_products");
      await SyncService.syncTable("sale_recipes");
      await SyncService.syncTable("recipe_ingredients");
      await SyncService.syncTable("expenses");

      console.log("¡Sincronización completada exitosamente!");
    } catch (error) {
      console.error("Error global durante la sincronización:", error);
    }
  },

  /**
   * Sincroniza una tabla específica filtrando los registros locales no guardados
   */
  syncTable: async (tableName: string) => {
    // Obtener los datos pendientes (sincronizado = 0) desde SQLite
    const pendingRecords = DATABASE.db.getAllSync(
      `SELECT * FROM ${tableName} WHERE sincronizado = 0`,
    ) as any[];

    if (pendingRecords.length === 0) return false;

    console.log(
      `Subiendo ${pendingRecords.length} registros pendientes de la tabla [${tableName}]...`,
    );

    const recordsToDelete = pendingRecords.filter(
      (record) => record.deleted_at !== null,
    );
    const recordsToUpsert = pendingRecords.filter(
      (record) => record.deleted_at === null,
    );

    if (recordsToDelete.length > 0) {
      const idsToDelete = recordsToDelete.map((r) => r.id);

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in("id", idsToDelete); // Borra en lote todos los IDs en la nube

      if (deleteError) {
        console.error(
          `Error al borrar en Supabase [${tableName}]:`,
          deleteError.message,
        );
        return false;
      }

      // FÍSICO LOCAL: Una vez borrado de la nube, ya podemos destruirlo con seguridad del teléfono
      const formattedIds = idsToDelete.map((id) => `'${id}'`).join(",");

      try {
        // 1. Apagamos temporalmente la verificación de llaves foráneas en el celular
        DATABASE.db.execSync("PRAGMA foreign_keys = OFF;");

        // 2. Ejecutamos el borrado físico sin bloqueos
        DATABASE.db.execSync(
          `DELETE FROM ${tableName} WHERE id IN (${formattedIds})`,
        );
      } finally {
        // 3. ¡Importante! Volvemos a encender la seguridad pase lo que pase
        DATABASE.db.execSync("PRAGMA foreign_keys = ON;");
      }
    }

    if (recordsToUpsert.length > 0) {
      // Quitar las columnas locales antes de enviar a la nube
      const cleanRecords = recordsToUpsert.map(
        ({ sincronizado, deleted_at, ...rest }) => rest,
      );

      const { error: upsertError } = await supabase
        .from(tableName)
        .upsert(cleanRecords);

      if (upsertError) {
        console.error(
          `Error al subir a Supabase [${tableName}]:`,
          upsertError.message,
        );
        return false;
      }

      // Marcar como sincronizados en el SQLite local
      const formattedIds = recordsToUpsert.map((r) => `'${r.id}'`).join(",");
      DATABASE.db.execSync(
        `UPDATE ${tableName} SET sincronizado = 1 WHERE id IN (${formattedIds})`,
      );
    }

    return true;
  },
};
