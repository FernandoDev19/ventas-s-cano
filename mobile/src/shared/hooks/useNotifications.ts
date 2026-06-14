import { useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/src/core/config/supabase";

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

  const notificationsConfigurate = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log(
          "⚠️ Estás en Expo Go. Las Push remotas están desactivadas para evitar el crash. ¡Sigue derecho!",
        );
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status: asksStatus } =
          await Notifications.requestPermissionsAsync();
        finalStatus = asksStatus;
      }

      if (finalStatus !== "granted") {
        console.log("❌ El usuario no dio permiso para notificaciones.");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "b8ba3324-6576-458a-8010-7aa73314f49d",
      });

      const token = tokenData.data;
      console.log("✅ Token obtenido:", token);

      await saveTokenInSupabase(token);

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF5722",
        });
      }
    } catch (error) {
      console.error("Error configurando las push notifications:", error);
    }
  }, []);

  return {
    notificationsConfigurate,
  };
};
