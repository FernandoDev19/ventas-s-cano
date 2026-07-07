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

// ◄ 1. ESTE COMPONENTE MANEJA LA SEGURIDAD (Ya el router está montado aquí)
function AuthProtector({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setRole(profile?.role ?? null);
      }

      setAuthReady(true);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setRole(profile?.role ?? null);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || (session && !role)) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === "(auth)" || firstSegment === "login";

    if (!session) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else if (inAuthGroup) {
      switch (role) {
        case "admin":
          router.replace("/(tabs)");
          break;

        case "cashier":
          router.replace("/(tabs)/(cashier)/cashier");
          break;

        case "kitchen":
          router.replace("/(tabs)/(orders)/orders");
          break;
      }
    }
  }, [session, authReady, segments, router, role]);

  if (!authReady) {
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

// ◄ 2. EL LAYOUT PRINCIPAL SOLO INICIALIZA LA APP SANA Y SALVA
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
