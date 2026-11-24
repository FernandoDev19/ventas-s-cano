// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SaleType } from "../types/sale.type";
import InfoChip from "@/src/shared/components/ui/InfoChip";
import {
  KIND_INFO,
  getPaymentInfo,
  parseSaleNote,
} from "@/src/shared/helpers/sale-note.helper";
import { C } from "@/src/core/theme/palette";

type Props = {
  sale: SaleType;
  onMarkAsPaid: (saleId: string) => void;
  payingId: string | null;
  onPress: () => void;
};

function formatAmount(amount: number): string {
  return `$${amount.toLocaleString("es-CO")}`;
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  if (d.toDateString() === new Date().toDateString()) return "Hoy";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function SaleCard({
  sale,
  onMarkAsPaid,
  payingId,
  onPress,
}: Props) {
  const isDebt = sale.is_debt;
  const isPaying = payingId === sale.id;
  const accent = isDebt ? "#f59e0b" : "#22c55e";

  const parsed = parseSaleNote(sale.note);
  const kind = parsed.kind ? KIND_INFO[parsed.kind] : null;
  const pay = getPaymentInfo(sale.payment_method);
  const itemsCount = sale.items_count ?? 0;

  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-3 rounded-2xl overflow-hidden active:opacity-95"
      style={{
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: isDebt ? "#f59e0b33" : "#22c55e22",
        elevation: 6,
      }}
    >
      <View style={{ height: 3, backgroundColor: accent }} />

      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="font-bold text-lg" style={{ color: C.soft }}>
              #{String(sale.id).slice(0, 8)}
            </Text>
            <View
              className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${accent}22` }}
            >
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <Text className="text-sm font-bold" style={{ color: accent }}>
                {isDebt ? "FIADO" : "PAGADO"}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-neutral-500 text-[12px] uppercase tracking-wider">
              {formatDate(sale.created_at!)}
            </Text>
            <Text className="font-bold text-lg" style={{ color: accent }}>
              {formatTime(sale.created_at!)}
            </Text>
          </View>
        </View>

        {/* Chips: tipo / pago / ítems */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {kind && (
            <InfoChip
              icon={kind.icon}
              label={parsed.kindLabel ?? kind.label}
              color={kind.color}
            />
          )}
          {pay && <InfoChip icon={pay.icon} label={pay.label} />}
          {itemsCount > 0 && (
            <InfoChip
              icon="basket-outline"
              label={`${itemsCount} ítem${itemsCount !== 1 ? "s" : ""}`}
              color="#ff5722"
            />
          )}
        </View>

        {/* Cliente */}
        {sale.client && (
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="person-outline" size={14} color="#ff5722" />
            <Text
              className="text-neutral-900 dark:text-white text-base font-semibold flex-1"
              numberOfLines={1}
            >
              {sale.client.name}
            </Text>
          </View>
        )}

        {/* Qué se vendió */}
        {!!sale.items_summary && (
          <Text
            className="text-neutral-700 dark:text-neutral-300 text-[15px] mb-2"
            numberOfLines={2}
          >
            {sale.items_summary}
          </Text>
        )}

        {/* Dirección domicilio */}
        {parsed.address && (
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="location-outline" size={14} color="#a855f7" />
            <Text
              className="text-neutral-600 dark:text-neutral-400 text-sm flex-1"
              numberOfLines={1}
            >
              {parsed.address}
            </Text>
          </View>
        )}

        {/* Nota del usuario */}
        {!!parsed.userNote && (
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color={C.muted}
            />
            <Text
              className="text-neutral-600 dark:text-neutral-400 text-sm italic flex-1"
              numberOfLines={1}
            >
              {parsed.userNote}
            </Text>
          </View>
        )}

        {/* Paga / cambio */}
        {parsed.paid && (
          <Text className="text-neutral-500 text-sm mb-2">
            Pagó {parsed.paid} · Cambio {parsed.change}
          </Text>
        )}

        {/* Vence */}
        {isDebt && sale.debt_date && (
          <View className="flex-row items-center gap-1 mb-2">
            <Ionicons name="calendar-outline" size={12} color="#f59e0b" />
            <Text className="text-sm" style={{ color: "#f59e0b" }}>
              Vence:{" "}
              {new Date(sale.debt_date).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        )}

        {/* Monto + acción */}
        <View
          className="flex-row justify-between items-center mt-1 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: "#262626" }}
        >
          <View>
            <Text className="text-2xl font-extrabold text-neutral-900 dark:text-white">
              {formatAmount(sale.total)}
            </Text>
            {isDebt &&
              (sale.debt_amount ?? 0) > 0 &&
              (sale.debt_amount ?? 0) < sale.total && (
                <Text className="text-sm" style={{ color: "#f59e0b" }}>
                  Debe: {formatAmount(sale.debt_amount ?? 0)}
                </Text>
              )}
          </View>

          {isDebt ? (
            <Pressable
              onPress={() => onMarkAsPaid(sale.id!)}
              disabled={isPaying}
              className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl active:opacity-80"
              style={{ backgroundColor: "#ff5722" }}
            >
              {isPaying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#fff"
                />
              )}
              <Text className="text-white font-bold text-base">
                {isPaying ? "..." : "Cobrar"}
              </Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text
                className="text-base font-medium"
                style={{ color: "#22c55e" }}
              >
                Al contado
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
