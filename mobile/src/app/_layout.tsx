import Header from "@/src/core/layouts/Header";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import DATABASE from "../core/config/db";
import { seeders } from "../core/config/seeders";
import { OrderProvider } from "../core/context/OrderContext";
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
      } catch (error) {
        console.error("Error al arrancar:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    inicializarTodo();
  }, [isInitialized]);

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
