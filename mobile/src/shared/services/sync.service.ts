import DATABASE from "@/src/core/config/db";
import { supabase } from "@/src/core/config/supabase";
import NetInfo from "@react-native-community/netinfo";

interface SyncConflict {
  table: string;
  recordId: string;
  localVersion: any;
  cloudVersion: any;
  resolution: "local" | "cloud";
}

const SYNC_LOG: SyncConflict[] = [];

const tableColumnsCache = new Map<string, Set<string>>();

const getTableColumns = (tableName: string): Set<string> => {
  let cols = tableColumnsCache.get(tableName);
  if (!cols) {
    try {
      const info = DATABASE.db.getAllSync(
        `PRAGMA table_info(${tableName});`,
      ) as any[];
      cols = new Set(info.map((c) => c.name));
      tableColumnsCache.set(tableName, cols);
    } catch {
      cols = new Set();
    }
  }
  return cols;
};

let running = false,
  queued = false;

const PAGE = 1000;
const fetchAll = async (table: string) => {
  const all: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return all;
};

export const SyncService = {
  /**
   * Ejecuta la sincronización bidireccional completa (Pull -> Push)
   */
  run: async () => {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      do {
        queued = false;
        await SyncService._runOnce();
      } while (queued);
    } finally {
      running = false;
    }
  },
  _runOnce: async () => {
    try {
      // 1. Verificar si hay internet
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        console.log("Sincronización cancelada: Sin conexión a internet.");
        return;
      }

      SYNC_LOG.length = 0;

      console.log("🔄 Iniciando sincronización bidireccional con Supabase...");

      const tablasParaBajar = [
        "categories",
        "products",
        "recipes",
        "recipe_ingredients",
        "clients",
        "suppliers",
        "employees",
        "payroll_payments",
        "expenses",
        "expense_items",
        "tables",
        "cashier_shifts",
        "cash_movements",
        "sales",
        "sale_products",
        "sale_recipes",
      ];

      for (const table of tablasParaBajar) {
        await SyncService.mergePullTable(table);
      }

      await SyncService.pushTable("categories");
      await SyncService.pushTable("products");
      await SyncService.pushTable("clients");
      await SyncService.pushTable("recipes");
      await SyncService.pushTable("sales");
      await SyncService.pushTable("sale_products");
      await SyncService.pushTable("sale_recipes");
      await SyncService.pushTable("recipe_ingredients");
      await SyncService.pushTable("suppliers");
      await SyncService.pushTable("employees");
      await SyncService.pushTable("expenses");
      await SyncService.pushTable("tables");
      await SyncService.pushTable("cashier_shifts");
      await SyncService.pushTable("cash_movements");

      await SyncService.pushTable("payroll_payments");
      await SyncService.pushTable("expense_items");

      console.log("✅ Sincronización completada exitosamente!");
      if (SYNC_LOG.length > 0) {
        console.warn(`⚠️  Se resolvieron ${SYNC_LOG.length} conflictos`);
        console.table(SYNC_LOG);
      }
    } catch (error) {
      console.error("❌ Error crítico en sincronización:", error);
    }
  },

  applyRealtime: (table: string, payload: any) => {
    DATABASE.db.execSync("PRAGMA foreign_keys = OFF;");
    try {
      if (payload.eventType === "DELETE") {
        DATABASE.db.runSync(`DELETE FROM ${table} WHERE id = ?`, [
          payload.old.id,
        ]);
        return;
      }
      const rec = payload.new;
      const local: any = DATABASE.db.getFirstSync(
        `SELECT updated_at, sincronizado FROM ${table} WHERE id = ?`,
        [rec.id],
      );
      // no pisar cambios locales pendientes ni versiones más nuevas
      if (
        !rec.deleted_at &&
        local &&
        (local.sincronizado === 0 ||
          new Date(local.updated_at) >= new Date(rec.updated_at))
      )
        return;
      SyncService._insertRecord(table, rec);
    } finally {
      DATABASE.db.execSync("PRAGMA foreign_keys = ON;");
    }
  },

  mergePullTable: async (tableName: string): Promise<boolean> => {
    try {
      console.log(`📥 Descargando [${tableName}]...`);

      // 1. Traer todos los datos de Supabase
      const cloudRecords = await fetchAll(tableName); // si falla, cae al catch y retorna false
      if (!cloudRecords || cloudRecords.length === 0) return true;

      // 2. Para cada registro, comparar timestamps
      DATABASE.db.execSync("PRAGMA foreign_keys = OFF;");

      try {
        DATABASE.db.withTransactionSync(() => {
          for (const cloudRecord of cloudRecords) {
            // Obtener versión local
            const localRecord: any = DATABASE.db.getFirstSync(
              `SELECT * FROM ${tableName} WHERE id = ?`,
              [cloudRecord.id],
            );

            if (cloudRecord.deleted_at) {
              SyncService._insertRecord(tableName, cloudRecord);
              continue;
            }

            if (!localRecord) {
              // Nuevo registro de la nube → Insertar
              SyncService._insertRecord(tableName, cloudRecord);
            } else {
              // Ambos existen → Comparar timestamps
              const localUpdated = new Date(localRecord.updated_at || 0);
              const cloudUpdated = new Date(cloudRecord.updated_at || 0);

              if (cloudUpdated > localUpdated) {
                // Cloud es más reciente → Traer cloud (REEMPLAZAR)
                SyncService._insertRecord(tableName, cloudRecord);
                SYNC_LOG.push({
                  table: tableName,
                  recordId: cloudRecord.id,
                  localVersion: localRecord,
                  cloudVersion: cloudRecord,
                  resolution: "cloud",
                });
                console.log(
                  `  ⚠️  [${tableName}:${cloudRecord.id}] Cloud es más nuevo (${cloudUpdated.getTime()} vs ${localUpdated.getTime()})`,
                );
              } else if (localUpdated > cloudUpdated) {
                // Local es más reciente → Mantener local (NO TOCAR)
                SYNC_LOG.push({
                  table: tableName,
                  recordId: cloudRecord.id,
                  localVersion: localRecord,
                  cloudVersion: cloudRecord,
                  resolution: "local",
                });
                console.log(
                  `  ✓ [${tableName}:${cloudRecord.id}] Local es más nuevo, manteniendo cambios`,
                );
              } else {
                // Misma fecha → "Last-Write-Wins" por content hash o cloud wins
                if (JSON.stringify(localRecord) !== JSON.stringify(cloudRecord)) {
                  SyncService._insertRecord(tableName, cloudRecord);
                  SYNC_LOG.push({
                    table: tableName,
                    recordId: cloudRecord.id,
                    localVersion: localRecord,
                    cloudVersion: cloudRecord,
                    resolution: "cloud",
                  });
                  console.log(
                    `  🔀 [${tableName}:${cloudRecord.id}] Timestamps iguales pero contenido diferente → Usando Cloud`,
                  );
                }
              }
            }
          }

          const cloudIds = new Set(cloudRecords.map((r: any) => String(r.id)));
          const synced: { id: string }[] = DATABASE.db.getAllSync(
            `SELECT id FROM ${tableName} WHERE sincronizado = 1`,
          );
          for (const { id } of synced) {
            if (!cloudIds.has(String(id))) {
              DATABASE.db.runSync(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
            }
          }
        });
        return true;
      } catch (err) {
        console.error(`❌ Error en mergePullTable [${tableName}]:`, err);
        return false;
      } finally {
        DATABASE.db.execSync("PRAGMA foreign_keys = ON;");
      }
    } catch (err) {
      console.error(`❌ Error en mergePullTable [${tableName}]:`, err);
      return false;
    }
  },

  _insertRecord: (tableName: string, record: any) => {
    const validCols = getTableColumns(tableName);
    const keys = Object.keys(record).filter(
      (k) => validCols.size === 0 || validCols.has(k),
    );
    const hasSincronizado =
      validCols.size === 0 || validCols.has("sincronizado");
    const columns = hasSincronizado
      ? [...keys, "sincronizado"].join(", ")
      : keys.join(", ");
    const placeholders = hasSincronizado
      ? [...keys.map(() => "?"), "1"].join(", ")
      : keys.map(() => "?").join(", ");
    const values = [...keys.map((k) => record[k])];

    const query = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    DATABASE.db.runSync(query, values);
  },

  pushTable: async (tableName: string): Promise<boolean> => {
    const pending: any[] = DATABASE.db.getAllSync(
      `SELECT * FROM ${tableName} WHERE sincronizado = 0`,
    );
    if (pending.length === 0) return true;

    console.log(`📤 Pusheando ${pending.length} cambios de [${tableName}]...`);
    try {
      for (let i = 0; i < pending.length; i += 200) {
        const chunk = pending.slice(i, i + 200);
        // se sube TAMBIÉN deleted_at: el borrado viaja como un update
        const payload = chunk.map(({ sincronizado, ...rest }) => rest);

        const { error } = await supabase.from(tableName).upsert(payload);
        if (error) {
          console.error(`❌ Error en upsert [${tableName}]:`, error.message);
          return false;
        }
        const ids = chunk.map((r) => r.id);
        DATABASE.db.runSync(
          `UPDATE ${tableName} SET sincronizado = 1 WHERE id IN (${ids.map(() => "?").join(",")})`,
          ids,
        );
      }
      console.log(`✅ [${tableName}] Push completado`);
      return true;
    } catch (err) {
      console.error(`❌ Error en pushTable [${tableName}]:`, err);
      return false;
    }
  },

  forceRepush: async () => {
    const now = new Date().toISOString();
    for (const t of ["categories", "products", "recipes", "recipe_ingredients", "clients",
      "sales", "sale_products", "sale_recipes", "expenses", "expense_items"]) {
      DATABASE.db.runSync(`UPDATE ${t} SET sincronizado = 0, updated_at = ?`, [now]);
    }
    await SyncService.run();
  },
};
