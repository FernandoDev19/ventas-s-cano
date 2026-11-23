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

/**
 * Barra inferior: máximo 4 botones por rol.
 *  - admin:   Vender · Ventas · Gastos · Más
 *  - cashier: Vender · Ventas · Caja   · Más
 *  - kitchen: Vender · Cocina
 *
 * Las rutas con roles: [] siguen existiendo (para no romper imports ni
 * notificaciones) pero NO aparecen en la barra; se llegan desde "Más".
 */
const tabs = [
  { name: "index", title: "Vender", icon: "flash", roles: ["admin", "cashier", "kitchen"] },
  { name: "(sales)/sales", title: "Ventas", icon: "receipt-outline", roles: ["admin", "cashier"] },
  { name: "(orders)/orders", title: "Cocina", icon: "flame-outline", roles: ["kitchen"] },
  { name: "(expenses)/expenses", title: "Gastos", icon: "cash-outline", roles: ["admin"] },
  { name: "(cashier)/cashier", title: "Caja", icon: "wallet-outline", roles: ["cashier"] },
  { name: "(more)/more", title: "Más", icon: "grid-outline", roles: ["admin", "cashier"] },
  // Ocultas de la barra (se acceden desde "Más")
  { name: "(inventory)/inventory", title: "Inventario", icon: "cube-outline", roles: [] as string[] },
  { name: "(clients)/clients", title: "Clientes", icon: "people-outline", roles: [] as string[] },
  { name: "(reports)/reports", title: "Reportes", icon: "stats-chart", roles: [] as string[] },
  { name: "(employees)/employees", title: "Empleados", icon: "people-circle-outline", roles: [] as string[] },
{ name: "(suppliers)/suppliers", title: "Proveedores", icon: "storefront-outline", roles: [] as string[] },
];

const audioSource = require("@/assets/sounds/alerta-notificacion.mp3");

export default function TabLayout() {
  const { role, loading } = useUserRole();
  const player = useAudioPlayer(audioSource);
  const router = useRouter();

  useEffect(() => {
    if (!role) return;

    const connectionId = Math.random().toString(36).substring(7);

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
            payload.old.kitchen_status !== "ready" &&
            payload.new.status !== "ready"
          ) {
            playSound();
            Alert.alert(
              "¡Pedido Listo! 🧑‍🍳",
              `El pedido de ${payload.new.customer_name} ya está listo.`,
            );
          }

          DeviceEventEmitter.emit("NUEVO_PEDIDO_DESDE_WEB");
        },
      );

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("❌ Error de conexión en Realtime. Revisa las políticas RLS.");
      }
    });

    return () => {
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
    <Tabs screenOptions={{ headerShown: false }}>
      {tabs.map((tab) => {
        const visible = tab.roles.includes(rolUsuario);

        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={
              visible
                ? {
                    title: tab.title,
                    tabBarActiveTintColor: activeColor,
                    tabBarButton: (props) => {
                      const isActive = props["aria-selected"];

                      return (
                        <Pressable
                          onPress={props.onPress}
                          android_ripple={{
                            color: "rgba(255, 87, 34, 0.15)",
                            borderless: true,
                          }}
                          className="flex-1"
                        >
                          <View
                            style={{ borderRadius: 10 }}
                            className={`${isActive ? "bg-primary" : ""} flex-col justify-center items-center rounded-lg py-2 w-full`}
                          >
                            <Ionicons name={tab.icon as any} size={22} color="white" />
                            <Text className="text-white text-xs">{tab.title}</Text>
                          </View>
                        </Pressable>
                      );
                    },
                  }
                : {
                    title: tab.title,
                    href: null,
                  }
            }
          />
        );
      })}
    </Tabs>
  );
}