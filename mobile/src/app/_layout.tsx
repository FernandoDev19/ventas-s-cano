import "react-native-get-random-values";
import "../global.css";
import Header from "@/src/core/layouts/Header";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { OrderProvider } from "../core/context/OrderContext";
import { ActivityIndicator, View } from "react-native";
import { AppBootstrap } from "../core/AppBootstrap";
import VirtualPrinterModal from "@/src/shared/components/printer/VirtualPrinterModal";
import { useEffect, useState } from "react";
import { supabase } from "../core/config/supabase";
import { useUserRole } from "@/src/shared/hooks/useUserRole";

function AuthProtector({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const { role, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setAuthReady(true);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Esperamos sesión y, si hay sesión, esperamos a que el rol termine de resolverse
    if (!authReady || (session && roleLoading)) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === "(auth)" || firstSegment === "login";

    if (!session) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
      return;
    }

    if (inAuthGroup) {
      // role siempre tendrá un valor ("admin"/"cashier"/"kitchen") gracias
      // al fallback consistente de ProfileService; "cashier" es el default seguro
      switch (role) {
        case "admin":
          router.replace("/(tabs)");
          break;
        case "kitchen":
          router.replace("/(tabs)/(orders)/orders");
          break;
        case "cashier":
        default:
          router.replace("/(tabs)/(cashier)/cashier");
          break;
      }
    }
  }, [session, authReady, roleLoading, segments, router, role]);

  if (!authReady || (session && roleLoading)) {
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

  return <>{children}</>;
}

export default function RootLayout() {
  const { isInitialized } = AppBootstrap();

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
        <AuthProtector>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen
              name="(tabs)"
              options={{ header: () => <Header />, headerShown: true }}
            />
          </Stack>
        </AuthProtector>
        <VirtualPrinterModal />
        <StatusBar style="auto" />
      </OrderProvider>
    </ThemeProvider>
  );
}
