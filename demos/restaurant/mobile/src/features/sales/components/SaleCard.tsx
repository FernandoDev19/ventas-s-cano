import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SaleType } from "../types/sale.type";

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
    const d = new Date(date);
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(date: Date | string): string {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return "Hoy";
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function SaleCard({ sale, onMarkAsPaid, payingId, onPress }: Props) {
    const isDebt = sale.is_debt;
    const isPaying = payingId === sale.id;

    return (
        <Pressable
            onPress={onPress}
            className="mx-4 mb-3 rounded-2xl overflow-hidden active:opacity-95"
            style={{
                backgroundColor: "#1a1a1a",
                borderWidth: 1,
                borderColor: isDebt ? "#f59e0b33" : "#22c55e22",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
            }}
        >
            {/* Color strip at top */}
            <View
                style={{
                    height: 3,
                    backgroundColor: isDebt ? "#f59e0b" : "#22c55e",
                }}
            />

            <View className="p-4">
                {/* Header Row */}
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center gap-2">
                        {/* Sale ID */}
                        <Text
                            className="font-bold text-base"
                            style={{ color: "#a3a3a3" }}
                        >
                            #{String(sale.id).slice(0, 8)}...
                        </Text>

                        {/* State Badge */}
                        <View
                            className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: isDebt ? "#f59e0b22" : "#22c55e22",
                            }}
                        >
                            <View
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: isDebt ? "#f59e0b" : "#22c55e" }}
                            />
                            <Text
                                className="text-xs font-bold"
                                style={{ color: isDebt ? "#f59e0b" : "#22c55e" }}
                            >
                                {isDebt ? "FIADO" : "PAGADO"}
                            </Text>
                        </View>
                    </View>

                    {/* Time */}
                    <View className="items-end">
                        <Text className="text-neutral-500 text-[10px] uppercase tracking-wider">
                            {formatDate(sale.created_at!)}
                        </Text>
                        <Text
                            className="font-bold text-base"
                            style={{ color: isDebt ? "#f59e0b" : "#22c55e" }}
                        >
                            {formatTime(sale.created_at!)}
                        </Text>
                    </View>
                </View>

                {sale.client && (
                    <Text className="text-white text-sm mb-3" numberOfLines={1}>
                        {sale.client.name}
                    </Text>
                )}

                {/* Note */}
                {sale.note ? (
                    <Text className="text-white text-sm mb-3" numberOfLines={1}>
                        {sale.note}
                    </Text>
                ) : (
                    <Text className="text-neutral-600 text-sm mb-3 italic">
                        Sin nota
                    </Text>
                )}

                {/* Debt date if applicable */}
                {isDebt && sale.debt_date && (
                    <View className="flex-row items-center gap-1 mb-3">
                        <Ionicons name="calendar-outline" size={12} color="#f59e0b" />
                        <Text className="text-xs" style={{ color: "#f59e0b" }}>
                            Vence: {new Date(sale.debt_date).toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </Text>
                    </View>
                )}

                {/* Amount + Action Row */}
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-2xl font-extrabold text-white">
                            {formatAmount(sale.total)}
                        </Text>
                        {isDebt && (sale.debt_amount ?? 0) > 0 && (sale.debt_amount ?? 0) < sale.total && (
                            <Text className="text-xs" style={{ color: "#f59e0b" }}>
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
                                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                            )}
                            <Text className="text-white font-bold text-sm">
                                {isPaying ? "..." : "Cobrar"}
                            </Text>
                        </Pressable>
                    ) : (
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                            <Text className="text-sm font-medium" style={{ color: "#22c55e" }}>
                                Al contado
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}
