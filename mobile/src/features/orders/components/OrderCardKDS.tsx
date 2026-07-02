import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { OrderPro } from "../types/order.type";
import { Audio } from "expo-av";
import { useUserRole } from "@/src/shared/hooks/useUserRole";

interface CardProps {
  item: OrderPro;
  onAccionEstado: (
    estado: "pending" | "accepted" | "preparing" | "ready" | "delivered" | "cancelled",
  ) => void;
  onChatCliente: () => void;
}

const parseUTCDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  let formatted = dateStr.replace(" ", "T");
  if (!formatted.includes("Z") && !/[+-]\d{2}:?\d{2}$/.test(formatted)) {
    formatted += "Z";
  }
  const parsed = new Date(formatted);
  return isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
};

export const OrderCardKDS = ({
  item,
  onAccionEstado,
  onChatCliente,
}: CardProps) => {
  const [minutosEnEspera, setMinutosEnEspera] = useState<number>(0);
  const { role } = useUserRole();
  const userRole = role || "cashier";

  useEffect(() => {
    const calcularTiempo = async () => {
      const creacion = parseUTCDate(item.created_at).getTime();
      const ahora = new Date().getTime();
      const diferenciaMinutos = Math.max(0, Math.floor((ahora - creacion) / 60000));
      setMinutosEnEspera(diferenciaMinutos);

      if (diferenciaMinutos >= 20 && (item.status === "accepted" || item.status === "preparing")) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("@/assets/sounds/alerta-cocina.mp3"),
          );
          await sound.playAsync();
          Alert.alert(
            "Alerta",
            "Han pasado mas de 20 minutos con el pedido sin finalizar",
          );
        } catch (e) {
          console.log("Error al pitar en cocina");
        }
      }
    };

    calcularTiempo();
    const interval = setInterval(calcularTiempo, 30000);
    return () => clearInterval(interval);
  }, [item.created_at, item.status]);

  const obtenerColorFondo = () => {
    if (minutosEnEspera < 10) return "bg-emerald-50 border-emerald-500";
    if (minutosEnEspera <= 20) return "bg-amber-50 border-amber-500";
    return "bg-rose-50 border-rose-500";
  };

  return (
    <View
      className={`rounded-xl p-4 mb-4 border-l-8 shadow-sm bg-white ${obtenerColorFondo()}`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-bold text-neutral-800">
            {item.customer_name}
          </Text>
          {item.table_id && (
            <View className="bg-amber-500 px-2 py-0.5 rounded">
              <Text className="text-white text-[10px] font-black">
                MESA {item.table_id}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-xs font-black text-neutral-400 uppercase">
          {item.delivery_type === "mesa" ? "Mesa QR" : item.delivery_type}
        </Text>
      </View>

      {/* WhatsApp Cliente */}
      <TouchableOpacity onPress={onChatCliente}>
        <Text className="text-emerald-600 font-semibold mb-1 text-xs">
          📞 {item.customer_phone} (Chatear)
        </Text>
      </TouchableOpacity>

      {item.comments && (
        <Text className="text-neutral-400 text-xs italic mb-2">
          💬 &quot;{item.comments}&quot;
        </Text>
      )}

      <View className="h-[1px] bg-neutral-100 my-2" />

      {/* Productos */}
      {item.order_items.map((detail) => (
        <Text key={detail.id} className="text-sm text-neutral-700 mb-0.5">
          • <Text className="font-bold">{detail.quantity}x</Text>{" "}
          {detail.products?.name || detail.recipes?.name}
        </Text>
      ))}

      <View className="h-[1px] bg-neutral-100 my-2" />

      {/* Footer / Botones dinámicos basados en tu lógica previa */}
      <View className="mt-1 flex-row justify-between items-center">
        <View>
          <Text className="text-[10px] text-neutral-400 uppercase font-bold">
            Total (⏱️ {Number(minutosEnEspera || 0)} min)
          </Text>
          {/* Si el usuario es admin, mostrar el precio */}
          {userRole !== "kitchen" && (
            <Text className="text-base font-black text-neutral-800">
              ${Number(item.total_price).toLocaleString("es-CO")}
            </Text>
          )}
        </View>

        {/* Si está pendiente: botones para aceptar o rechazar */}
        {item.status === "pending" && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="bg-red-500 px-3 py-1.5 rounded-lg"
              onPress={() => onAccionEstado("cancelled")}
            >
              <Text className="text-white font-bold text-xs">Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-emerald-600 px-4 py-1.5 rounded-lg"
              onPress={() => onAccionEstado("accepted")}
            >
              <Text className="text-white font-bold text-xs">Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Si está aceptado: botón para iniciar preparación */}
        {item.status === "accepted" && (
          <TouchableOpacity
            className="bg-orange-500 px-4 py-2 rounded-lg"
            onPress={() => onAccionEstado("preparing")}
          >
            <Text className="text-white font-bold text-xs">
              Preparar Pedido 🍳
            </Text>
          </TouchableOpacity>
        )}

        {/* Si está preparándose: botón para marcar como listo */}
        {item.status === "preparing" && (
          <TouchableOpacity
            className="bg-amber-600 px-4 py-2 rounded-lg"
            onPress={() => onAccionEstado("ready")}
          >
            <Text className="text-white font-bold text-xs">
              Pedido Listo 🚀
            </Text>
          </TouchableOpacity>
        )}

        {/* Si está listo para entregar */}
        {item.status === "ready" && (
          <TouchableOpacity
            className="bg-blue-600 px-4 py-2 rounded-lg"
            onPress={() => onAccionEstado("delivered")}
          >
            <Text className="text-white font-bold text-xs">
              Entregar Pedido ✓
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
