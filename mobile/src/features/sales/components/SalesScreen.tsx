import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    View
} from "react-native";
import { SalesService } from "../services/sales.service";
import { SaleType } from "../types/sale.type";
import SaleCard from "./SaleCard";
import SalesSummaryBar, { FilterId } from "./SalesSummaryBar";
import SaleDetailModal from "./SaleDetailModal";
import { useFocusEffect } from "expo-router";

export default function SalesScreen() {
    const [sales, setSales] = useState<SaleType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterId>("all");
    const [payingId, setPayingId] = useState<number | null>(null);
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

    const loadSales = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const data = await SalesService.getSales();
            setSales(data);
        } catch (err) {
            console.error("Error loading sales:", err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSales();
    }, [loadSales]);

    useFocusEffect(
        useCallback(()=>{
            loadSales();
        }, [loadSales])
    );

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadSales(true);
    }, [loadSales]);

    const filteredSales = useMemo(() => {
        if (filter === "paid") return sales.filter((s) => !s.is_debt);
        if (filter === "debt") return sales.filter((s) => s.is_debt);
        return sales;
    }, [sales, filter]);

    const handleMarkAsPaid = useCallback(
        async (saleId: number) => {
            Alert.alert(
                "Cobrar venta",
                "¿Seguro que quieres marcar esta venta como pagada?",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Cobrar",
                        style: "default",
                        onPress: async () => {
                            setPayingId(saleId);
                            try {
                                await SalesService.markSaleAsPaid(saleId);
                                // Update locally without re-fetching
                                setSales((prev) =>
                                    prev.map((s) =>
                                        s.id === saleId
                                            ? { ...s, is_debt: false, debt_amount: 0 }
                                            : s
                                    )
                                );
                            } catch (err) {
                                Alert.alert("Error", "No se pudo actualizar la venta.");
                            } finally {
                                setPayingId(null);
                            }
                        },
                    },
                ]
            );
        },
        []
    );

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: "#0f0f0f" }}>
                <ActivityIndicator size="large" color="#ff5722" />
                <Text className="text-neutral-500 mt-3 text-sm">Cargando ventas...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: "#0f0f0f" }}>
            <FlatList
                data={filteredSales}
                keyExtractor={(item) => String(item.id)}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#ff5722"
                    />
                }
                ListHeaderComponent={
                    <View className="pt-4">
                        {/* Title */}
                        <View className="px-4 mb-4 flex-row justify-between items-center">
                            <View>
                                <Text className="text-2xl font-extrabold text-white">
                                    Ventas
                                </Text>
                                <Text className="text-neutral-500 text-sm">
                                    {sales.length} venta{sales.length !== 1 ? "s" : ""} registrada
                                    {sales.length !== 1 ? "s" : ""}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="analytics-outline" size={20} color="#ff5722" />
                            </View>
                        </View>

                        <SalesSummaryBar
                            filter={filter}
                            setFilter={setFilter}
                            sales={sales}
                        />

                        {/* Section label */}
                        <View className="px-4 mb-2 flex-row items-center gap-2">
                            <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
                            <Text className="text-neutral-600 text-xs uppercase tracking-widest px-2">
                                {filter === "all"
                                    ? "Todas las ventas"
                                    : filter === "paid"
                                        ? "Ventas pagadas"
                                        : "Ventas fiadas"}
                            </Text>
                            <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <SaleCard
                        sale={item}
                        onMarkAsPaid={handleMarkAsPaid}
                        payingId={payingId}
                        onPress={() => setSelectedSaleId(item.id ?? null)}
                    />
                )}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20 px-8">
                        <View
                            className="w-20 h-20 rounded-full items-center justify-center mb-4"
                            style={{ backgroundColor: "#1a1a1a" }}
                        >
                            <Ionicons name="receipt-outline" size={36} color="#444" />
                        </View>
                        <Text className="text-white font-bold text-lg text-center mb-1">
                            Sin ventas
                        </Text>
                        <Text className="text-neutral-500 text-sm text-center">
                            {filter === "debt"
                                ? "¡Genial! No tienes ventas fiadas pendientes"
                                : "Aún no hay ventas registradas"}
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />

            <SaleDetailModal
                visible={selectedSaleId !== null}
                saleId={selectedSaleId}
                onClose={() => setSelectedSaleId(null)}
                onUpdated={() => loadSales(true)}
            />
        </View>
    );
}
