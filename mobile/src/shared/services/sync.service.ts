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

      SYNC_LOG.length = 0;

      console.log("🔄 Iniciando sincronización bidireccional con Supabase...");

      const tablasParaBajar = [
        "categories",
        "products",
        "recipes",
        "recipe_ingredients",
        "clients",
        "tables"
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
      await SyncService.pushTable("expenses");
      await SyncService.pushTable("tables");

      console.log("✅ Sincronización completada exitosamente!");
      if (SYNC_LOG.length > 0) {
        console.warn(`⚠️  Se resolvieron ${SYNC_LOG.length} conflictos`);
        console.table(SYNC_LOG);
      }
    } catch (error) {
      console.error("❌ Error crítico en sincronización:", error);
    }
  },

  mergePullTable: async (tableName: string): Promise<boolean> => {
    try {
      console.log(`📥 Descargando [${tableName}]...`);

      // 1. Traer todos los datos de Supabase
      const { data: cloudRecords, error } = await supabase
        .from(tableName)
        .select("*");

      if (error) {
        console.error(`❌ Error descargando [${tableName}]:`, error.message);
        return false;
      }

      if (!cloudRecords || cloudRecords.length === 0) {
        return true;
      }

      // 2. Para cada registro, comparar timestamps
      DATABASE.db.execSync("PRAGMA foreign_keys = OFF;");

      DATABASE.db.withTransactionSync(() => {
        for (const cloudRecord of cloudRecords) {
          // Obtener versión local
          const localRecord: any = DATABASE.db.getFirstSync(
            `SELECT * FROM ${tableName} WHERE id = ?`,
            [cloudRecord.id],
          );

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
      });

      DATABASE.db.execSync("PRAGMA foreign_keys = ON;");
      return true;
    } catch (err) {
      console.error(`❌ Error en mergePullTable [${tableName}]:`, err);
      return false;
    }
  },

  _insertRecord: (tableName: string, record: any) => {
    const keys = Object.keys(record);
    const columns = [...keys, "sincronizado"].join(", ");
    const placeholders = [...keys.map(() => "?"), "1"].join(", ");
    const values = [...keys.map((k) => record[k])];

    const query = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    DATABASE.db.runSync(query, values);
  },

  pushTable: async (tableName: string): Promise<boolean> => {
    const pendingRecords: any[] = DATABASE.db.getAllSync(
      `SELECT * FROM ${tableName} WHERE sincronizado = 0`,
    );

    if (pendingRecords.length === 0) {
      return true; // Nada que pushear
    }

    console.log(
      `📤 Pusheando ${pendingRecords.length} cambios de [${tableName}]...`,
    );

    try {
      // 1. Separar registros a eliminar vs actualizar
      const recordsToDelete = pendingRecords.filter(
        (r) => r.deleted_at !== null,
      );
      const recordsToUpsert = pendingRecords.filter(
        (r) => r.deleted_at === null,
      );

      // 2. Eliminar registros marcados como deleted
      if (recordsToDelete.length > 0) {
        const idsToDelete = recordsToDelete.map((r) => r.id);

        // VALIDACIÓN: Verificar que en la nube existen y no han sido modificados
        const { data: cloudVersions, error: fetchError } = await supabase
          .from(tableName)
          .select("id, updated_at")
          .in("id", idsToDelete);

        if (fetchError) {
          console.error(
            `❌ Error validando eliminaciones en [${tableName}]:`,
            fetchError.message,
          );
          return false;
        }

        // Verificar que no han sido modificados DESPUÉS de nuestro deleted_at
        for (const cloudRec of cloudVersions || []) {
          const localRec = recordsToDelete.find((r) => r.id === cloudRec.id);
          if (localRec) {
            const cloudUpdated = new Date(cloudRec.updated_at || 0);
            const localDeleted = new Date(localRec.deleted_at || 0);

            if (cloudUpdated > localDeleted) {
              console.warn(
                `⚠️  [${tableName}:${cloudRec.id}] Conflicto: Cloud modificado DESPUÉS de nuestro delete. Ignorando.`,
              );
              // NO borrar si la nube lo modificó después
              continue;
            }
          }
        }

        // Ejecutar eliminación
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .in("id", idsToDelete);

        if (deleteError) {
          console.error(
            `❌ Error eliminando en [${tableName}]:`,
            deleteError.message,
          );
          return false;
        }

        // Actualizar local como sincronizado
        const formattedIds = idsToDelete.map((id) => `'${id}'`).join(",");
        DATABASE.db.execSync("PRAGMA foreign_keys = OFF;");
        DATABASE.db.execSync(
          `DELETE FROM ${tableName} WHERE id IN (${formattedIds})`,
        );
        DATABASE.db.execSync("PRAGMA foreign_keys = ON;");
      }

      // 3. Upsert registros (crear o actualizar)
      if (recordsToUpsert.length > 0) {
        const cleanRecords = recordsToUpsert.map(
          ({ sincronizado, deleted_at, ...rest }) => rest,
        );

        // VALIDACIÓN PRE-UPSERT: Revisar conflictos
        const recordIds = recordsToUpsert.map((r) => r.id);
        const { data: cloudVersions, error: fetchError } = await supabase
          .from(tableName)
          .select("id, updated_at, *")
          .in("id", recordIds);

        if (fetchError) {
          console.error(
            `❌ Error validando upserts en [${tableName}]:`,
            fetchError.message,
          );
          return false;
        }

        // Detectar conflictos: cloud más nuevo que local
        const conflictingIds: string[] = [];
        for (const cloudRec of cloudVersions || []) {
          const localRec = recordsToUpsert.find((r) => r.id === cloudRec.id);
          if (localRec) {
            const cloudUpdated = new Date(cloudRec.updated_at || 0);
            const localUpdated = new Date(localRec.updated_at || 0);

            if (cloudUpdated > localUpdated) {
              console.warn(
                `⚠️  [${tableName}:${cloudRec.id}] No subiendo: Cloud es más nuevo`,
              );
              conflictingIds.push(cloudRec.id);
            }
          }
        }

        // Filtrar registros conflictivos
        const validRecords = cleanRecords.filter(
          (r: any) => !conflictingIds.includes(r.id),
        );

        // Ejecutar upsert
        if (validRecords.length > 0) {
          const { error: upsertError } = await supabase
            .from(tableName)
            .upsert(validRecords);

          if (upsertError) {
            console.error(
              `❌ Error en upsert [${tableName}]:`,
              upsertError.message,
            );
            // ROLLBACK: NO marcar como sincronizado
            return false;
          }

          // Marcar solo los que se subieron exitosamente
          const formattedIds = validRecords
            .map((r: any) => `'${r.id}'`)
            .join(",");
          DATABASE.db.execSync(
            `UPDATE ${tableName} SET sincronizado = 1 WHERE id IN (${formattedIds})`,
          );
        }
      }

      console.log(`✅ [${tableName}] Push completado`);
      return true;
    } catch (err) {
      console.error(`❌ Error en pushTable [${tableName}]:`, err);
      return false;
    }
  },
};
