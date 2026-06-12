import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SalesService } from "@/src/features/sales/services/sales.service";
import ExpensesService from "@/src/features/expenses/services/expense.service";
import { SaleType } from "@/src/features/sales/types/sale.type";
import { useRouter } from "expo-router";
import SaleDetailModal from "@/src/features/sales/components/SaleDetailModal";

function formatAmount(amount: number): string {
  return `$${amount.toLocaleString("es-CO")}`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Hoy";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ReportsScreen() {
  const router = useRouter();

  const [sales, setSales] = useState<SaleType[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [weeklySalesList, setWeeklySalesList] = useState<{ dateStr: string; total: number }[]>([]);

  const [totalDay, setTotalDay] = useState(0);
  const [totalMonth, setTotalMonth] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [debtTotal, setDebtTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [summary, allExpenses, byCat] = await Promise.all([
        SalesService.getReportsSummary(),
        ExpensesService.getAllExpenses(),
        ExpensesService.getTotalByCategory(),
      ]);

      setSales(summary.recentSales);
      setWeeklySalesList(summary.weeklySales);
      setExpensesList(allExpenses);
      setByCategory(byCat);

      setTotalDay(summary.totalDay);
      setTotalMonth(summary.totalMonth);
      setTotalExpenses(allExpenses.reduce((s: number, e: any) => s + e.amount, 0));
      setDebtTotal(summary.debtTotal);
      setPaidTotal(summary.paidTotal);
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData(true);
  }, [loadData]);

  const netProfit = totalMonth - totalExpenses;

  // Calculate Last 7 Days Activity (Sales vs Expenses)
  const weeklyData = useMemo(() => {
    const days: any[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        dateStr,
        label: d.toLocaleDateString("es-CO", { weekday: "short" }),
        sales: 0,
        expenses: 0,
      });
    }

    weeklySalesList.forEach((w) => {
      const dayObj = days.find((d) => d.dateStr === w.dateStr);
      if (dayObj) {
        dayObj.sales = w.total;
      }
    });

    expensesList.forEach((exp) => {
      if (exp.date) {
        const dateKey = new Date(exp.date).toISOString().split("T")[0];
        const dayObj = days.find((d) => d.dateStr === dateKey);
        if (dayObj) {
          dayObj.expenses += exp.amount;
        }
      }
    });

    const maxVal = Math.max(
      ...days.map((d) => Math.max(d.sales, d.expenses)),
      1000
    );

    return { days, maxVal };
  }, [weeklySalesList, expensesList]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f0f",
        }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
        <Text style={{ color: "#737373", marginTop: 12, fontSize: 13 }}>
          Cargando reportes...
        </Text>
      </View>
    );
  }

  // Show only 5 recent sales on dashboard
  const recentSales = sales.slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <FlatList
        data={recentSales}
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
            {/* Header */}
            <View className="px-4 mb-5">
              <Text className="text-2xl font-extrabold text-white">Reportes</Text>
              <Text className="text-neutral-500 text-sm">
                Resumen general del negocio
              </Text>
            </View>

            {/* Hero KPI - Ventas hoy */}
            <Pressable
              onPress={() => router.push("/(orders)/orders" as any)}
              className="mx-4 mb-4 p-5 rounded-2xl active:opacity-90"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-neutral-500 text-xs uppercase tracking-widest">
                  Ventas de Hoy
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#555" />
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-5xl font-extrabold text-white">
                  {formatAmount(totalDay)}
                </Text>
                <View
                  className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                  style={{ backgroundColor: "#22c55e22" }}
                >
                  <Ionicons name="trending-up" size={14} color="#22c55e" />
                </View>
              </View>
            </Pressable>

            {/* KPI 2x2 grid */}
            <View className="flex-row mx-4 gap-3 mb-3">
              {/* Total cobrado */}
              <Pressable
                onPress={() => router.push("/(orders)/orders" as any)}
                className="flex-1 p-4 rounded-2xl active:opacity-90"
                style={{
                  backgroundColor: "#22c55e15",
                  borderWidth: 1,
                  borderColor: "#22c55e33",
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={14}
                      color="#22c55e"
                    />
                    <Text
                      className="text-[11px] uppercase tracking-wider font-bold"
                      style={{ color: "#22c55e" }}
                    >
                      Cobrado
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={12} color="#22c55e" />
                </View>
                <Text
                  className="text-xl font-extrabold"
                  style={{ color: "#22c55e" }}
                >
                  {formatAmount(paidTotal)}
                </Text>
              </Pressable>

              {/* Por cobrar (fiados) */}
              <Pressable
                onPress={() => router.push("/(orders)/orders" as any)}
                className="flex-1 p-4 rounded-2xl active:opacity-90"
                style={{
                  backgroundColor: "#f59e0b15",
                  borderWidth: 1,
                  borderColor: "#f59e0b33",
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="time-outline" size={14} color="#f59e0b" />
                    <Text
                      className="text-[11px] uppercase tracking-wider font-bold"
                      style={{ color: "#f59e0b" }}
                    >
                      Por cobrar
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={12} color="#f59e0b" />
                </View>
                <Text
                  className="text-xl font-extrabold"
                  style={{ color: "#f59e0b" }}
                >
                  {formatAmount(debtTotal)}
                </Text>
              </Pressable>
            </View>

            <View className="flex-row mx-4 gap-3 mb-5">
              {/* Total gastos */}
              <Pressable
                onPress={() => router.push("/(expenses)/expenses" as any)}
                className="flex-1 p-4 rounded-2xl active:opacity-90"
                style={{
                  backgroundColor: "#ef444415",
                  borderWidth: 1,
                  borderColor: "#ef444433",
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="card-outline" size={14} color="#ef4444" />
                    <Text
                      className="text-[11px] uppercase tracking-wider font-bold"
                      style={{ color: "#ef4444" }}
                    >
                      Gastos
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={12} color="#ef4444" />
                </View>
                <Text
                  className="text-xl font-extrabold"
                  style={{ color: "#ef4444" }}
                >
                  -{formatAmount(totalExpenses)}
                </Text>
              </Pressable>

              {/* Ganancia neta */}
              <View
                className="flex-1 p-4 rounded-2xl"
                style={{
                  backgroundColor: netProfit >= 0 ? "#22c55e15" : "#ef444415",
                  borderWidth: 1,
                  borderColor: netProfit >= 0 ? "#22c55e33" : "#ef444433",
                }}
              >
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Ionicons
                    name={
                      netProfit >= 0
                        ? "trending-up-outline"
                        : "trending-down-outline"
                    }
                    size={14}
                    color={netProfit >= 0 ? "#22c55e" : "#ef4444"}
                  />
                  <Text
                    className="text-[11px] uppercase tracking-wider font-bold"
                    style={{ color: netProfit >= 0 ? "#22c55e" : "#ef4444" }}
                  >
                    Ganancia
                  </Text>
                </View>
                <Text
                  className="text-xl font-extrabold"
                  style={{ color: netProfit >= 0 ? "#22c55e" : "#ef4444" }}
                >
                  {netProfit >= 0 ? "" : "-"}{formatAmount(Math.abs(netProfit))}
                </Text>
              </View>
            </View>

            {/* Weekly Performance Bar Chart */}
            <View
              className="mx-4 mb-5 p-4 rounded-2xl"
              style={{
                backgroundColor: "#1a1a1a",
                borderWidth: 1,
                borderColor: "#2a2a2a",
              }}
            >
              <Text className="text-white font-bold text-base mb-1">
                Actividad Semanal
              </Text>
              <Text className="text-neutral-500 text-xs mb-4">
                Ventas vs Gastos de los últimos 7 días
              </Text>

              {/* Legend */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: "#ff5722" }}
                  />
                  <Text className="text-neutral-400 text-xs font-semibold">
                    Ventas
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: "#ef4444" }}
                  />
                  <Text className="text-neutral-400 text-xs font-semibold">
                    Gastos
                  </Text>
                </View>
              </View>

              {/* Bars Container */}
              <View className="flex-row justify-between items-end h-32 pt-2 px-1">
                {weeklyData.days.map((day) => {
                  const salesHeightPercent =
                    (day.sales / weeklyData.maxVal) * 100;
                  const expensesHeightPercent =
                    (day.expenses / weeklyData.maxVal) * 100;
                  return (
                    <View key={day.dateStr} className="items-center flex-1">
                      {/* Bars */}
                      <View className="flex-row items-end gap-1 h-20 mb-2">
                        {/* Sales Bar */}
                        <View
                          style={{
                            width: 8,
                            height: `${Math.max(salesHeightPercent, 4)}%`,
                            backgroundColor: day.sales > 0 ? "#ff5722" : "#333",
                            borderRadius: 4,
                          }}
                        />
                        {/* Expenses Bar */}
                        <View
                          style={{
                            width: 8,
                            height: `${Math.max(expensesHeightPercent, 4)}%`,
                            backgroundColor: day.expenses > 0 ? "#ef4444" : "#333",
                            borderRadius: 4,
                          }}
                        />
                      </View>
                      {/* Day label */}
                      <Text className="text-neutral-500 text-[10px] capitalize">
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Category Breakdown Progress Bars */}
            {byCategory.length > 0 && (
              <View
                className="mx-4 mb-5 p-4 rounded-2xl"
                style={{
                  backgroundColor: "#1a1a1a",
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                }}
              >
                <Text className="text-white font-bold text-base mb-1">
                  Distribución de Gastos
                </Text>
                <Text className="text-neutral-500 text-xs mb-4">
                  Gasto total agrupado por categoría
                </Text>

                <View className="gap-3">
                  {byCategory.map((item) => {
                    const maxCategoryTotal = Math.max(
                      ...byCategory.map((c) => c.total),
                      1
                    );
                    const widthPercent = (item.total / maxCategoryTotal) * 100;
                    return (
                      <View key={item.category}>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-neutral-300 text-xs font-semibold">
                            {item.category}
                          </Text>
                          <Text className="text-neutral-400 text-xs">
                            {formatAmount(item.total)}
                          </Text>
                        </View>
                        <View className="h-2 rounded-full w-full bg-neutral-800 overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: "#ff5722",
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Recent sales section header */}
            <View className="px-4 mb-3 flex-row justify-between items-center">
              <Text className="text-white font-bold text-base">
                Pedidos Recientes
              </Text>
              <Pressable
                onPress={() => router.push("/(orders)/orders" as any)}
                hitSlop={12}
              >
                <Text className="text-xs font-semibold" style={{ color: "#ff5722" }}>
                  Ver todos &rsaquo;
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedSaleId(item.id ?? null)}
            className="mx-4 mb-3 p-4 rounded-2xl flex-row items-center gap-3 active:opacity-90"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            {/* Icon */}
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{
                backgroundColor: item.is_debt ? "#f59e0b22" : "#22c55e22",
              }}
            >
              <Ionicons
                name={item.is_debt ? "time-outline" : "checkmark-circle-outline"}
                size={20}
                color={item.is_debt ? "#f59e0b" : "#22c55e"}
              />
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text
                className="text-white font-semibold text-sm"
                numberOfLines={1}
              >
                #{String(item.id).padStart(3, "0")}
                {item.note ? ` – ${item.note}` : ""}
              </Text>
              <Text className="text-neutral-500 text-xs mt-0.5">
                {formatDate(item.created_at!)} • {formatTime(item.created_at!)}
              </Text>
            </View>

            {/* Amount */}
            <Text
              className="text-base font-extrabold"
              style={{ color: item.is_debt ? "#f59e0b" : "#fff" }}
            >
              {formatAmount(item.total)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-8">
            <Ionicons name="bar-chart-outline" size={48} color="#333" />
            <Text className="text-white font-bold text-lg text-center mt-4 mb-1">
              Sin ventas aún
            </Text>
            <Text className="text-neutral-500 text-sm text-center">
              Los reportes aparecerán cuando haya ventas registradas
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
        onUpdated={() => loadData(true)}
      />
    </View>
  );
}
