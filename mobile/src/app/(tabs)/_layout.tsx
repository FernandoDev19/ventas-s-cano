import { supabase } from "@/src/core/config/supabase";
import { useUserRole } from "@/src/shared/hooks/useUserRole";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

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
    // ID único para que cada dispositivo mantenga su canal limpio sin pisarse
    const connectionId = Math.random().toString(36).substring(7);
    console.log(
      `🔌 Conectando canal Realtime [pedidos-${connectionId}] para el rol: ${role}`,
    );
    
    const channel = supabase
      .channel(`pedidos-global-${connectionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          console.log("⚡ EVENTO RECIBIDO EN REALTIME:", payload.eventType);

          if (
            role &&
            payload.eventType === "INSERT" &&
            role !== "kitchen"
          ) {
            console.log("📢 NUEVO PEDIDO WEB DETECTADO");
            try {
              player.play();
              console.log("Reproduciendo...");
            } catch (e) {
              console.error(e);
            }
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
              ]
            );
          }
        },
      );

    // ◄ AJUSTE CLAVE: Escuchamos el estado de la suscripción para pillar si Supabase conecta
    channel.subscribe((status) => {
      console.log(`📡 ESTADO DEL CANAL [pedidos-${connectionId}]:`, status);
      if (status === "CHANNEL_ERROR") {
        console.error(
          "❌ Error de conexión en Realtime. Revisa las políticas o el SQL de Supabase.",
        );
      }
    });

    return () => {
      console.log(`🔌 Desconectando canal Realtime [pedidos-${connectionId}]`);
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
