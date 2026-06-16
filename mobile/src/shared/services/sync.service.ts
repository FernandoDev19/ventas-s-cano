import DATABASE from "@/src/core/config/db";
import { supabase } from "@/src/core/config/supabase";
import NetInfo from "@react-native-community/netinfo";

export const SyncService = {
  /**
   * Ejecuta la sincronización bidireccional completa (Pull -> Push)
   */
  run: async () => {
    try {
      // 1. Verificar si hay internet
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        console.log("Sincronización cancelada: Sin conexión a internet.");
        return;
      }

      console.log("🔄 Iniciando sincronización bidireccional con Supabase...");

      // ==========================================
      // FASE 1: PULL (Bajar datos de la nube al móvil)
      // Tablas maestras e inventario indispensables
      // ==========================================
      const tablasParaBajar = [
        "categories",
        "products",
        "recipes",
        "recipe_ingredients",
        "clients"
      ];

      for (const table of tablasParaBajar) {
        await SyncService.pullTable(table);
      }

      // ==========================================
      // FASE 2: PUSH (Subir cambios locales a la nube)
      // Conservamos tu orden original de dependencias
      // ==========================================
      await SyncService.syncTable("categories");
      await SyncService.syncTable("products");
      await SyncService.syncTable("clients");
      await SyncService.syncTable("recipes");
      await SyncService.syncTable("sales");
      await SyncService.syncTable("sale_products");
      await SyncService.syncTable("sale_recipes");
      await SyncService.syncTable("recipe_ingredients");
      await SyncService.syncTable("expenses");

      console.log("¡Sincronización bidireccional completada exitosamente!");
    } catch (error) {
      console.error("Error global durante la sincronización:", error);
    }
  },

  /**
   * FASE PULL: Se trae los datos de la nube y los clava en el SQLite
   */
  pullTable: async (tableName: string) => {
    try {
      console.log(`📥 Descargando actualizaciones de la tabla [${tableName}]...`);

      // 1. Traer todo de Supabase
      const { data: cloudRecords, error } = await supabase
        .from(tableName)
        .select("*");

      if (error) {
        console.error(`Error al descargar [${tableName}]:`, error.message);
        return false;
      }

      if (!cloudRecords || cloudRecords.length === 0) return true;

      // 2. Insertar o Reemplazar en lote en SQLite local
      // Desactivamos llaves foráneas un momento por seguridad en el lote
      DATABASE.db.execSync("PRAGMA foreign_keys = OFF;");
      
      DATABASE.db.withTransactionSync(() => {
        for (const record of cloudRecords) {
          // Extraemos las columnas dinámicamente de la data de la nube
          const keys = Object.keys(record);
          const columns = [...keys, "sincronizado"].join(", ");
          
          // Mapeamos los valores y forzamos que sincronizado sea 1 (ya viene de la nube)
          const placeholders = [...keys.map(() => "?"), "1"].join(", ");
          const values = [...keys.map(k => record[k])];

          const query = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
          DATABASE.db.runSync(query, values);
        }
      });

      console.log(`✅ Tabla [${tableName}] actualizada localmente con ${cloudRecords.length} registros.`);
      return true;
    } catch (err) {
      console.error(`Chicharrón haciendo Pull de [${tableName}]:`, err);
      return false;
    } finally {
      DATABASE.db.execSync("PRAGMA foreign_keys = ON;");
    }
  },

  /**
   * FASE PUSH: Sincroniza una tabla filtrando los registros locales no guardados
   */
  syncTable: async (tableName: string) => {
    // Tu código original impecable que filtra deleted_at, hace el upsert y el update local...
    const pendingRecords = DATABASE.db.getAllSync(
      `SELECT * FROM ${tableName} WHERE sincronizado = 0`,
    ) as any[];

    if (pendingRecords.length === 0) return false;

    console.log(
      `Subiendo ${pendingRecords.length} registros pendientes de la tabla [${tableName}]...`,
    );

    const recordsToDelete = pendingRecords.filter((record) => record.deleted_at !== null);
    const recordsToUpsert = pendingRecords.filter((record) => record.deleted_at === null);

    if (recordsToDelete.length > 0) {
      const idsToDelete = recordsToDelete.map((r) => r.id);
      const { error: deleteError } = await supabase.from(tableName).delete().in("id", idsToDelete);

      if (deleteError) {
        console.error(`Error al borrar en Supabase [${tableName}]:`, deleteError.message);
        return false;
      }

      const formattedIds = idsToDelete.map((id) => `'${id}'`).join(",");
      try {
        DATABASE.db.execSync("PRAGMA foreign_keys = OFF;");
        DATABASE.db.execSync(`DELETE FROM ${tableName} WHERE id IN (${formattedIds})`);
      } finally {
        DATABASE.db.execSync("PRAGMA foreign_keys = ON;");
      }
    }

    if (recordsToUpsert.length > 0) {
      const cleanRecords = recordsToUpsert.map(({ sincronizado, deleted_at, ...rest }) => rest);
      const { error: upsertError } = await supabase.from(tableName).upsert(cleanRecords);

      if (upsertError) {
        console.error(`Error al subir a Supabase [${tableName}]:`, upsertError.message);
        return false;
      }

      const formattedIds = recordsToUpsert.map((r) => `'${r.id}'`).join(",");
      DATABASE.db.execSync(`UPDATE ${tableName} SET sincronizado = 1 WHERE id IN (${formattedIds})`);
    }

    return true;
  },
};