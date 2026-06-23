import { Alert, DeviceEventEmitter } from "react-native";
import { SalesService } from "../features/sales/services/sales.service";
import { SyncService } from "../shared/services/sync.service";
import DATABASE from "./config/db";
// import { seeders } from "./config/seeders";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./config/supabase";
import { useRouter } from "expo-router";
import { useNotifications } from "../shared/hooks/useNotifications";
import { Audio } from "expo-av";
import NetInfo from "@react-native-community/netinfo";

export const AppBootstrap = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { notificationsConfigurate, listenToNotifications } =
    useNotifications();
  const router = useRouter();

  async function reproducirSonidAlerta() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/sounds/alerta-notificacion.mp3"),
      );

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Error al reproducir el sonido de alerta:", error);
    }
  }

  const ordersRealtime = useCallback(() => {
    console.log("🔌 Conectando canal Realtime para pedidos nuevos...");

    const channel = supabase
      .channel("pedidos-en-vivo")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          console.log("📢 PEDIDO NUEVO RECIBIDO EN TIEMPO REAL");

          DeviceEventEmitter.emit("NUEVO_PEDIDO_DESDE_WEB");

          await reproducirSonidAlerta();

          const deliveryTypeMap: Record<string, string> = {
            comer_aqui: "pedido para Comer Aquí 🍽️",
            para_llevar: "pedido Para Llevar 🛍️",
            domicilio: "Domicilio 🛵",
            local: "pedido para Recoger en Local 🏪",
          };

          const textType =
            deliveryTypeMap[payload.new.delivery_type] ||
            `pedido (${payload.new.delivery_type})`;

          Alert.alert(
            "¡PEDIDO NUEVO!",
            `El cliente ${payload.new.customer_name} solicitó un ${textType}. \nTotal: $${Number(payload.new.total_price).toLocaleString("es-CO")}`,
            [
              {
                text: "Ver pedido",
                onPress: () =>
                  router.push({
                    pathname: "/(tabs)/(sales)/sales",
                    params: { tab: "Ordenes" },
                  }),
              },
            ],
          );
        },
      )
      .subscribe();

    // Retorna la función que remueve el canal
    return () => {
      console.log("🔌 Desconectando canal Realtime de pedidos...");
      supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    notificationsConfigurate();

    const unsubscribeClicks = listenToNotifications();

    // Limpieza obligatoria al desmontar el componente
    return () => {
      if (unsubscribeClicks) unsubscribeClicks();
    };
  }, [notificationsConfigurate, listenToNotifications]);

  useEffect(() => {
    let unsubscribeNetInfo: (() => void) | undefined;
    let unsubscribeRealtime: (() => void) | undefined;

    async function inicializarTodo() {
      try {
        // 1. Inicializar la base de datos local SQLite
        await DATABASE.initDb();

        // 2. Ejecutar los seeders de desarrollo
        // if(__DEV__) {
        //   await seeders.run();
        // }

        // 3. Forzar una sincronización inicial por si quedaron ventas reales con '0' antes de cerrar la app
        await SyncService.run();

        // 4. Configurar el escuchador de red de forma correcta en el nivel superior
        unsubscribeNetInfo = NetInfo.addEventListener((state) => {
          if (state.isConnected) {
            console.log(
              "LOG [RED]: ¡Internet detectado! Ejecutando SyncService...",
            );
            SyncService.run();
          }
        });

        // 5. Verificar alertas de deudas expiradas
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

        unsubscribeRealtime = ordersRealtime();
      } catch (error) {
        console.error("Error crítico al arrancar la aplicación:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    inicializarTodo();

    // Función de limpieza de React completa
    return () => {
      if (unsubscribeNetInfo) {
        unsubscribeNetInfo();
      }
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
      }
    };
  }, [ordersRealtime]);

  return { isInitialized };
};
