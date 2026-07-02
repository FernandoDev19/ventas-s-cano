import 'react-native-get-random-values';
import "../global.css";
import Header from "@/src/core/layouts/Header";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { OrderProvider } from "../core/context/OrderContext";
import { ActivityIndicator, View } from "react-native";
import { AppBootstrap } from '../core/AppBootstrap';
import VirtualPrinterModal from '@/src/shared/components/printer/VirtualPrinterModal';
import { useEffect, useState } from 'react';
import { supabase } from '../core/config/supabase';

// ◄ 1. ESTE COMPONENTE MANEJA LA SEGURIDAD (Ya el router está montado aquí)
function AuthProtector({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Revisar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    // Escuchar cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === '(auth)' || firstSegment === 'login';

    if (!session && !inAuthGroup) {
      // Sin sesión -> pa' fuera al login
      router.replace('/(auth)/login' as any);
    } else if (session && inAuthGroup) {
      // Con sesión intentando ver login -> pa' dentro
      router.replace('/(tabs)' as any);
    }
  }, [session, authReady, segments, router]);

  if (!authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#141414", justifyContent: "center", alignItems: "center" }}>
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
      <View style={{ flex: 1, backgroundColor: "#141414", justifyContent: "center", alignItems: "center" }}>
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
            <Stack.Screen name="(tabs)" options={{ header: () => <Header />, headerShown: true }} />
          </Stack>
        </AuthProtector>
        <VirtualPrinterModal />
        <StatusBar style="auto" />
      </OrderProvider>
    </ThemeProvider>
  );
}