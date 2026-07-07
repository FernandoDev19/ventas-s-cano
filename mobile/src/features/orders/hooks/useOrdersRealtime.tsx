import { supabase } from "@/src/core/config/supabase";
import { useAudioPlayer } from "expo-audio";
import { useEffect } from "react";
import { OrderStatusTabType } from "../types/status-tab.type";
import { Alert } from "react-native";

const audioSource = require("@/assets/sounds/alerta-notificacion.mp3");

interface UseOrdersRealtimeProps {
  activeTabRef: React.RefObject<"pending" | "accepted" | "preparing" | "ready" | "delivered" | "cancelled">;
  userRole: string;
  cargarOrdenes: (status: OrderStatusTabType) => void;
}

export const useOrdersRealtime = ({
  activeTabRef,
  userRole,
  cargarOrdenes,
}: UseOrdersRealtimeProps) => {
  const player = useAudioPlayer(audioSource);

  useEffect(() => {
    // ID único para que cada dispositivo mantenga su canal limpio sin pisarse
    const connectionId = Math.random().toString(36).substring(7);
    console.log(
      `🔌 Conectando canal Realtime [pedidos-${connectionId}] para el rol: ${userRole}`,
    );

    const channel = supabase
      .channel(`pedidos-global-${connectionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          console.log("⚡ EVENTO RECIBIDO EN REALTIME:", payload.eventType);
          const tabActual = activeTabRef.current;

          if (
            payload.eventType === "INSERT" &&
            userRole !== "kitchen" &&
            tabActual === "pending"
          ) {
            console.log("📢 NUEVO PEDIDO WEB DETECTADO EN CAJA");
            cargarOrdenes(tabActual);
            try {
              player.play();
            } catch (error) {
              console.error("Error al reproducir el sonido de alerta:", error);
            }
            Alert.alert(
              "¡PEDIDO NUEVO!",
              `Llegó un pedido de ${payload.new.customer_name}.`,
            );
          }

          // 🍳 CASO 2: Caja aceptó el pedido -> Solo Cocina en pestaña accepted/preparing
          if (
            payload.eventType === "UPDATE" &&
            userRole === "kitchen" &&
            payload.new.kitchen_status === "pending" &&
            payload.old.kitchen_status !== "pending"
          ) {
            console.log("🍳 NUEVA COMANDA EN COCINA");
            await cargarOrdenes(tabActual);
            try {
              player.play();
            } catch (error) {
              console.error("Error al reproducir el sonido de alerta:", error);
            }
            Alert.alert(
              "¡NUEVA COMANDA! 🍳",
              `Preparar pedido para: ${payload.new.customer_name}`,
            );
          }

          // 🔔 CASO 3: Cocina terminó el plato -> Alerta de vuelta a Caja/Admin
          if (
            payload.eventType === "UPDATE" &&
            userRole !== "kitchen" &&
            payload.new.kitchen_status === "ready" &&
            payload.old.kitchen_status !== "ready"
          ) {
            console.log("🔔 PEDIDO LISTO PARA DESPACHAR");
            cargarOrdenes(tabActual);
            try {
              player.play();
            } catch (error) {
              console.error("Error al reproducir el sonido de alerta:", error);
            }
            Alert.alert(
              "¡Pedido Listo! 🧑‍🍳",
              `El pedido de ${payload.new.customer_name} ya está listo.`,
            );
          }

          // Para cualquier otro cambio de estado, refrescamos la pestaña actual
          if (payload.eventType === "UPDATE") {
            cargarOrdenes(tabActual);
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
  }, [userRole, player, cargarOrdenes, activeTabRef]);

  return {};
};
