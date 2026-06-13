import { SalesService } from "@/src/features/sales/services/sales.service";
import { Alert } from "react-native";
import { SyncService } from "../services/sync.service";
import { seeders } from "@/src/core/config/seeders";
import DATABASE from "@/src/core/config/db";
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export const useApp = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let unsubscribeNetInfo: (() => void) | undefined;

    async function inicializarTodo() {
      try {
        // 1. Inicializar la base de datos local SQLite
        await DATABASE.initDb();

        // 2. Ejecutar los seeders de desarrollo
        await seeders.run();

        // 3. Forzar una sincronización inicial por si quedaron ventas reales con '0' antes de cerrar la app
        await SyncService.run();

        // 4. Configurar el escuchador de red de forma correcta en el nivel superior
        unsubscribeNetInfo = NetInfo.addEventListener((state) => {
          if (state.isConnected) {
            console.log("LOG [RED]: ¡Internet detectado! Ejecutando SyncService...");
            SyncService.run();
          }
        });

        // 5. Verificar alertas de deudas expiradas
        const debts = await SalesService.getDebtSales();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDebts = debts.filter((d) => {
          if (!d.debt_date) return false;
          const dueDate = new Date(d.debt_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate <= today;
        });

        if (dueDebts.length > 0) {
          Alert.alert(
            "Deudas Pendientes",
            `Tienes ${dueDebts.length} venta(s) fiada(s) cuya fecha de cobro es hoy o ya expiró. ¡Revisa los reportes o deudas!`,
            [{ text: "Entendido", style: "default" }],
          );
        }

      } catch (error) {
        console.error("Error crítico al arrancar la aplicación:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    inicializarTodo();

    // Función de limpieza real de React para remover el escuchador de NetInfo
    return () => {
      if (unsubscribeNetInfo) {
        unsubscribeNetInfo();
      }
    };
  }, []); // Quitamos 'isInitialized' de las dependencias para evitar ejecuciones infinitas

  return { isInitialized };
};
