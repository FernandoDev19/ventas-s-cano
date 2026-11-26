import { useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router"; // Asegúrate de importar el router de Expo
import { supabase } from "@/src/core/config/supabase";
import Constants, { ExecutionEnvironment } from "expo-constants";

// Configuración obligatoria fuera del hook para que la app sepa qué hacer con la app abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const saveTokenInSupabase = async (token: string) => {
    const { error } = await supabase
      .from("push_tokens")
      .upsert([{ token: token, updated_at: new Date().toISOString() }], {
        onConflict: "token",
      });

    if (error) {
      console.error("Error guardando el token en la nube:", error);
    } else {
      console.log("✅ Token asegurado en Supabase para este teléfono.");
    }
  };

  // Tu función original melá, usando tu projectId real
  const notificationsConfigurate = useCallback(async (role: string) => {
    if (Platform.OS === "web") return;
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
      return; // Expo Go

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF5722",
      });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    const status =
      existing === "granted"
        ? existing
        : (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: "b8ba3324-6576-458a-8010-7aa73314f49d",
    });
    await supabase
      .from("push_tokens")
      .upsert(
        [
          {
            token,
            role,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "token" },
      );
  }, []);

  // 🚀 LA TRAÍDA DEL MÁS ALLÁ: Escuchar cuando el dueño toca la notificación
  const listenToNotifications = useCallback((role: string) => {
    if (Platform.OS === "web") return () => {};
    const go = (r: Notifications.NotificationResponse) => {
      if (!r.notification.request.content.data?.orderId) return;
      router.push(
        role === "kitchen"
          ? "/(tabs)/(orders)/orders"
          : { pathname: "/(tabs)/(sales)/sales", params: { tab: "Ordenes" } },
      );
    };
    Notifications.getLastNotificationResponseAsync().then((r) => r && go(r)); // app cerrada
    const sub = Notifications.addNotificationResponseReceivedListener(go);
    return () => sub.remove();
  }, []);

  return {
    notificationsConfigurate,
    listenToNotifications, // Lo exportas aquí para amarrarlo en el _layout.tsx
  };
};
