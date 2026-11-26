// @theme-migrated
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { OrderPro } from "../types/order.type";
import { useUserRole } from "@/src/shared/hooks/useUserRole";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import InfoChip from "@/src/shared/components/ui/InfoChip";
import {
  KIND_INFO,
  OrderKind,
  parseSaleNote,
} from "@/src/shared/helpers/sale-note.helper";
import { C } from "@/src/core/theme/palette";

const alertedOrders = new Set<string>();

interface CardProps {
  item: OrderPro;
  onAccionEstado: (
    estado:
      | "pending"
      | "accepted"
      | "preparing"
      | "ready"
      | "delivered"
      | "cancelled",
  ) => void;
  onChatCliente: () => void;
  onPrintBill: () => void;
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

const ACTIVE = ["pending", "accepted", "preparing"];

const urgency = (min: number) => {
  if (min < 10) return { color: "#22c55e", label: "A tiempo" };
  if (min <= 20) return { color: "#f59e0b", label: "Atención" };
  return { color: "#ef4444", label: "Retrasado" };
};

const Btn = ({
  label,
  bg,
  onPress,
  outline,
}: {
  label: string;
  bg: string;
  onPress: () => void;
  outline?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={{
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: outline ? "transparent" : bg,
      borderWidth: outline ? 1.5 : 0,
      borderColor: bg,
    }}
  >
    <Text
      style={{ color: outline ? bg : "#fff", fontWeight: "800", fontSize: 15 }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export const OrderCardKDS = ({
  item,
  onAccionEstado,
  onChatCliente,
  onPrintBill,
}: CardProps) => {
  const [minutosEnEspera, setMinutosEnEspera] = useState(0);
  const alertedRef = useRef(false);
  const { role } = useUserRole();
  const userRole = role || "cashier";
  const isKitchen = userRole === "kitchen";

  useEffect(() => {
    const tick = async () => {
      const creacion = parseUTCDate(item.created_at).getTime();
      const mins = Math.max(0, Math.floor((Date.now() - creacion) / 60000));
      setMinutosEnEspera(mins);

      if (
        mins >= 20 &&
        (item.status === "accepted" || item.status === "preparing") &&
        !alertedOrders.has(item.id)
      ) {
        alertedOrders.add(item.id);
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("@/assets/sounds/alerta-cocina.mp3"),
          );
          sound.setOnPlaybackStatusUpdate((s) => {
            if (s.isLoaded && s.didJustFinish) sound.unloadAsync(); // suelta el foco
          });
          await sound.playAsync();
        } catch {
          console.log("Error al pitar en cocina");
        }
      }
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [item.created_at, item.status, item.id]);

  const parsed = parseSaleNote(item.comments);
  const kind: OrderKind =
    item.delivery_type === "domicilio"
      ? "domicilio"
      : item.table_id
        ? "mesa"
        : item.delivery_type === "para_llevar" || parsed.kind === "para_llevar"
          ? "para_llevar"
          : "comer_aqui";
  const kindInfo = KIND_INFO[kind];
  const kindLabel = kind === "mesa" ? `Mesa ${item.table_id}` : kindInfo.label;
  const address = item.delivery_address || parsed.address;
  const isActive = ACTIVE.includes(item.status);
  const urg = urgency(minutosEnEspera);
  const barColor = isActive ? urg.color : C.line;
  const clock = parseUTCDate(item.created_at).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const renderButtons = () => {
    const reject = (
      <Btn
        key="r"
        label="Rechazar"
        bg="#ef4444"
        outline
        onPress={() => onAccionEstado("cancelled")}
      />
    );
    const prepare = (
      <Btn
        key="p"
        label="Preparar 🍳"
        bg="#f97316"
        onPress={() => onAccionEstado("preparing")}
      />
    );

    switch (item.status) {
      case "pending":
        return [
          reject,
          <Btn
            key="a"
            label="Aceptar"
            bg="#10b981"
            onPress={() => onAccionEstado("accepted")}
          />,
        ];
      case "accepted":
        if (isKitchen) return [prepare];
        if (userRole === "admin") return [reject, prepare];
        return [reject];
      case "preparing":
        return [
          <Btn
            key="l"
            label="Pedido listo 🚀"
            bg="#f59e0b"
            onPress={() => onAccionEstado("ready")}
          />,
        ];
      case "ready":
        return [
          !isKitchen && onPrintBill ? (
            <Btn
              key="i"
              label="Imprimir 🖨️"
              bg="#525252"
              onPress={onPrintBill}
            />
          ) : null,
          <Btn
            key="d"
            label={
              kind === "mesa"
                ? "Finalizar mesa 🍽️"
                : kind === "domicilio"
                  ? "Despachar 🛵"
                  : "Entregar ✓"
            }
            bg={kind === "mesa" ? "#9333ea" : "#2563eb"}
            onPress={() => onAccionEstado("delivered")}
          />,
        ];
      default:
        return [];
    }
  };

  const buttons = renderButtons();

  return (
    <View
      style={{
        marginBottom: 14,
        borderRadius: 18,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.line,
        overflow: "hidden",
      }}
    >
      <View style={{ height: 3, backgroundColor: barColor }} />

      <View style={{ padding: 14 }}>
        {/* Header: tipo + id | tiempo */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <InfoChip
              icon={kindInfo.icon}
              label={kindLabel}
              color={kindInfo.color}
            />
            <Text style={{ color: C.muted, fontSize: 14, fontWeight: "700" }}>
              #{String(item.id).slice(0, 6).toUpperCase()}
            </Text>
          </View>

          {isActive ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: `${urg.color}22`,
              }}
            >
              <Ionicons name="time-outline" size={12} color={urg.color} />
              <Text
                style={{ color: urg.color, fontSize: 13, fontWeight: "800" }}
              >
                {minutosEnEspera} min · {urg.label}
              </Text>
            </View>
          ) : (
            <Text style={{ color: C.muted, fontSize: 14 }}>{clock}</Text>
          )}
        </View>

        {/* Cliente */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: C.text, fontSize: 19, fontWeight: "800" }}
              numberOfLines={1}
            >
              {item.customer_name}
            </Text>
            {!!item.customer_phone && (
              <Text style={{ color: C.muted, fontSize: 14, marginTop: 1 }}>
                {item.customer_phone}
              </Text>
            )}
          </View>
          {!!item.customer_phone && (
            <TouchableOpacity
              onPress={onChatCliente}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#25D36622",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dirección */}
        {!!address && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Ionicons name="location-outline" size={14} color="#a855f7" />
            <Text style={{ color: C.soft, fontSize: 14, flex: 1 }}>
              {address}
            </Text>
          </View>
        )}

        {/* Nota */}
        {!!parsed.userNote && (
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              padding: 10,
              borderRadius: 10,
              backgroundColor: "#f59e0b12",
              borderWidth: 1,
              borderColor: "#f59e0b33",
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color="#f59e0b"
            />
            <Text style={{ color: C.warnText, fontSize: 14, flex: 1 }}>
              {parsed.userNote}
            </Text>
          </View>
        )}

        {/* Ítems */}
        <View
          style={{
            paddingVertical: 8,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#262626",
            marginVertical: 6,
          }}
        >
          {item.order_items.map((d) => (
            <View
              key={d.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 4,
              }}
            >
              <View
                style={{
                  minWidth: 34,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                  backgroundColor: "#ff572222",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#ff5722", fontWeight: "900", fontSize: 15 }}
                >
                  {d.quantity}x
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  color: C.text,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {d.products?.name || d.recipes?.name || "Producto"}
              </Text>
              {!isKitchen && (
                <Text style={{ color: C.muted, fontSize: 14 }}>
                  {priceFormat(d.price_at_time * d.quantity)}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Total / paga */}
        {!isKitchen && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 12,
            }}
          >
            <View>
              <Text
                style={{
                  color: C.muted,
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                Total
              </Text>
              {parsed.paid && (
                <Text style={{ color: C.muted, fontSize: 13 }}>
                  Paga {parsed.paid} · Cambio {parsed.change}
                </Text>
              )}
            </View>
            <Text style={{ color: C.text, fontSize: 24, fontWeight: "900" }}>
              {priceFormat(Number(item.total_price))}
            </Text>
          </View>
        )}

        {/* Acciones */}
        {buttons.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: isKitchen ? 8 : 0,
            }}
          >
            {buttons}
          </View>
        )}
      </View>
    </View>
  );
};
