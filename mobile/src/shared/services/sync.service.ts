import DATABASE from '@/src/core/config/db';
import { supabase } from '@/src/core/config/supabase';
import NetInfo from '@react-native-community/netinfo';

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
      await SyncService.syncTable('categories');
      await SyncService.syncTable('products');
      await SyncService.syncTable('clients');
      await SyncService.syncTable('sales');
      await SyncService.syncTable('sale_products');
      await SyncService.syncTable('expenses');
      await SyncService.syncTable('recipes');
      await SyncService.syncTable('recipe_ingredients');

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
    // Usamos getAllSync de expo-sqlite
    const pendingRecords = DATABASE.db.getAllSync(
      `SELECT * FROM ${tableName} WHERE sincronizado = 0`
    ) as any[];

    if (pendingRecords.length === 0) return false;

    console.log(`Subiendo ${pendingRecords.length} registros pendientes de la tabla [${tableName}]...`);

    // Limpiamos los registros eliminando la columna 'sincronizado' antes de mandarlos a la nube
    const cleanRecords = pendingRecords.map(({ sincronizado, ...rest }) => rest);

    // .upsert inserta si es nuevo o actualiza si el UUID ya existe en Supabase
    const { error } = await supabase
      .from(tableName)
      .upsert(cleanRecords);

    if (error) {
      console.error(`Error al subir la tabla ${tableName} a Supabase:`, error.message);
      return false;
    }

    // Si la nube los aceptó, marcamos esos registros como sincronizados locales (sincronizado = 1)
    // Extraemos los IDs de los registros procesados
    const syncedIds = pendingRecords.map(record => `'${record.id}'`).join(',');
    
    DATABASE.db.execSync(
      `UPDATE ${tableName} SET sincronizado = 1 WHERE id IN (${syncedIds})`
    );
    return true
  }
};
