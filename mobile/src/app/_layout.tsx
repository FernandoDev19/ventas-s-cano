import 'react-native-get-random-values';
import "../global.css";
import Header from "@/src/core/layouts/Header";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { OrderProvider } from "../core/context/OrderContext";
import { useApp } from "../shared/hooks/useApp";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const { isInitialized } = useApp();

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#141414",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
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
