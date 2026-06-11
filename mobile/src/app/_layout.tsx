import Header from "@/src/core/layouts/Header";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Alert, ActivityIndicator, View } from "react-native";
import DATABASE from "../core/config/db";
import { seeders } from "../core/config/seeders";
import { OrderProvider } from "../core/context/OrderContext";
import { SalesService } from "../features/sales/services/sales.service";
import "../global.css";

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    async function inicializarTodo() {
      try {
        // 1. Las tablas
        await DATABASE.initDb();

        // 2. Los datos de prueba
        await seeders.run();

        // 3. Verificar alertas de deudas
        const debts = await SalesService.getDebtSales();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDebts = debts.filter(d => {
          if (!d.debt_date) return false;
          const dueDate = new Date(d.debt_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate <= today;
        });

        if (dueDebts.length > 0) {
          Alert.alert(
            "Deudas Pendientes",
            `Tienes ${dueDebts.length} venta(s) fiada(s) cuya fecha de cobro es hoy o ya expiró. ¡Revisa los reportes o deudas!`,
            [{ text: "Entendido", style: "default" }]
          );
        }

      } catch (error) {
        console.error("Error al arrancar:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    inicializarTodo();
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: "#141414", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <OrderProvider>
        <Stack>
          {/* Tabs */}
          <Stack.Screen name="(tabs)" options={{ header: () => <Header /> }} />
        </Stack>
        <StatusBar style="auto" />
      </OrderProvider>
    </ThemeProvider>
  );
}
