import { supabase } from "@/src/core/config/supabase";
import { useUserRole } from "@/src/shared/hooks/useUserRole";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Pressable,
  Text,
  View,
} from "react-native";

const activeColor = "#ff5722";

const tabs = [
  {
    name: "index",
    title: "Menú",
    icon: "book",
    rolesPermitidos: ["admin", "cashier", "kitchen"],
  },
  {
    name: "(orders)/orders",
    title: "Ordenes",
    icon: "receipt-outline",
    rolesPermitidos: ["kitchen"],
  },
  {
    name: "(sales)/sales",
    title: "Ventas",
    icon: "receipt-outline",
    rolesPermitidos: ["admin", "cashier"],
  },
  {
    name: "(inventory)/inventory",
    title: "Inventario",
    icon: "cube-outline",
    rolesPermitidos: ["admin"],
  },
  {
    name: "(expenses)/expenses",
    title: "Gastos",
    icon: "cash-outline",
    rolesPermitidos: ["admin"],
  },
  {
    name: "(cashier)/cashier",
    title: "Cajero",
    icon: "cash-outline",
    rolesPermitidos: ["cashier"],
  },
  {
    name: "(clients)/clients",
    title: "Clientes",
    icon: "people-outline",
    rolesPermitidos: ["admin", "cashier"],
  },
  {
    name: "(reports)/reports",
    title: "Reportes",
    icon: "stats-chart",
    rolesPermitidos: ["admin"],
  },
];

const audioSource = require("@/assets/sounds/alerta-notificacion.mp3");

export default function TabLayout() {
  const { role, loading } = useUserRole();
  const player = useAudioPlayer(audioSource);
  const router = useRouter();

  useEffect(() => {
    if (!role) return; // esperamos a saber el rol antes de decidir qué escuchar

    const connectionId = Math.random().toString(36).substring(7);
    console.log(
      `🔌 Conectando canal Realtime GLOBAL [pedidos-${connectionId}] rol: ${role}`,
    );

    const playSound = () => {
      try {
        player.play();
      } catch (e) {
        console.error("Error reproduciendo sonido:", e);
      }
    };

    const channel = supabase
      .channel(`pedidos-global-${connectionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("⚡ [GLOBAL] EVENTO REALTIME:", payload.eventType);

          // CASO 1: Nuevo pedido web -> avisar a caja/admin
          if (
            payload.eventType === "INSERT" &&
            role !== "kitchen" &&
            payload.new.cashier_status === "pending"
          ) {
            playSound();
            Alert.alert(
              "¡PEDIDO NUEVO!",
              `Llegó un pedido de ${payload.new.customer_name}.`,
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
          }

          // CASO 2: Caja aceptó -> avisar a cocina
          if (
            payload.eventType === "UPDATE" &&
            role === "kitchen" &&
            payload.new.kitchen_status === "pending" &&
            payload.old.kitchen_status !== "pending"
          ) {
            playSound();
            Alert.alert(
              "¡NUEVA COMANDA! 🍳",
              `Preparar pedido para: ${payload.new.customer_name}`,
            );
          }

          // CASO 3: Cocina terminó -> avisar a caja/admin
          if (
            payload.eventType === "UPDATE" &&
            role !== "kitchen" &&
            payload.new.kitchen_status === "ready" &&
            payload.old.kitchen_status !== "ready"
          ) {
            playSound();
            Alert.alert(
              "¡Pedido Listo! 🧑‍🍳",
              `El pedido de ${payload.new.customer_name} ya está listo.`,
            );
          }

          // Refrescar cualquier pantalla de órdenes montada
          DeviceEventEmitter.emit("NUEVO_PEDIDO_DESDE_WEB");
        },
      );

    channel.subscribe((status) => {
      console.log(
        `📡 [GLOBAL] ESTADO DEL CANAL [pedidos-${connectionId}]:`,
        status,
      );
      if (status === "CHANNEL_ERROR") {
        console.error(
          "❌ Error de conexión en Realtime. Revisa las políticas RLS.",
        );
      }
    });

    return () => {
      console.log(
        `🔌 Desconectando canal Realtime GLOBAL [pedidos-${connectionId}]`,
      );
      supabase.removeChannel(channel);
    };
  }, [role, player, router]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#141414] justify-center items-center">
        <ActivityIndicator size="small" color="#ff5722" />
      </View>
    );
  }

  const rolUsuario = role || "cashier";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabs.map((tab) => {
        const tienePermiso = tab.rolesPermitidos.includes(rolUsuario);

        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarActiveTintColor: activeColor,
              tabBarItemStyle: !tienePermiso ? { display: "none" } : {},

              tabBarButton: (props) => {
                if (!tienePermiso) return null;

                const isActive = props["aria-selected"];

                return (
                  <Pressable
                    onPress={props.onPress}
                    android_ripple={{
                      color: "rgba(255, 87, 34, 0.15)",
                      borderless: true,
                    }}
                    // Opcional: Dale un flex-1 para que ocupe el espacio equitativamente
                    className="flex-1"
                  >
                    <View
                      style={{ borderRadius: 10 }}
                      className={`${isActive ? "bg-primary" : ""} flex-col justify-center items-center rounded-lg py-2 w-full`}
                    >
                      <Ionicons
                        name={tab.icon as any}
                        size={20}
                        color="white"
                      />
                      <Text className="text-white text-xs">{tab.title}</Text>
                    </View>
                  </Pressable>
                );
              },
            }}
          />
        );
      })}
    </Tabs>
  );
}
