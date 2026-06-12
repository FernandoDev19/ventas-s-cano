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
    if (isInitialized) return;

    async function inicializarTodo() {
      try {
        // 1. Las tablas
        await DATABASE.initDb();

        // 2. Los datos de prueba
        await seeders.run();

        // 3. Sincronización
        SyncService.run();

        // 4. Escuchar cambios de red
        const unsubscribe = NetInfo.addEventListener((state) => {
          if (state.isConnected) {
            console.log("¡Internet recuperado! Lanzando sincronizador...");
            SyncService.run();
          }
        });

        // 5. Verificar alertas de deudas
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

        return () => unsubscribe();
      } catch (error) {
        console.error("Error al arrancar:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    inicializarTodo();
  }, [isInitialized]);

  return { isInitialized };
};
