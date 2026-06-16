import { useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router"; // Asegúrate de importar el router de Expo
import { supabase } from "@/src/core/config/supabase";

// Configuración obligatoria fuera del hook para que la app sepa qué hacer con la app abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
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

      // Dejamos tu projectId intacto para cuando tires el build nativo
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "b8ba3324-6576-458a-8010-7aa73314f49d",
      });

      const token = tokenData.data;
      console.log("✅ Token obtenido:", token);

      await saveTokenInSupabase(token);

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
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

  // 🚀 LA TRAÍDA DEL MÁS ALLÁ: Escuchar cuando el dueño toca la notificación
  const listenToNotifications = useCallback(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Extraemos el ID de la orden que viaja en el objeto 'data' desde la Edge Function
        const orderId = response.notification.request.content.data?.orderId;

        if (orderId) {
          console.log(`🚀 Abriendo la orden desde la notificación: ${orderId}`);
          // Lo mandas directo a la vista de órdenes
          router.push({
            pathname: "/(tabs)/(sales)/sales",
            params: { tab: "Ordenes" },
          });
        }
      },
    );

    // Retornamos la función para poder limpiar el invento en el layout
    return () => {
      subscription.remove();
    };
  }, []);

  return {
    notificationsConfigurate,
    listenToNotifications, // Lo exportas aquí para amarrarlo en el _layout.tsx
  };
};
