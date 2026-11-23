import { Alert } from "react-native";
import { SalesService } from "../services/sales.service";
import { CashierService } from "../../cashier/services/cashier.service";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SaleType } from "../types/sale.type";
import { FilterId } from "../components/SalesSummaryBar";

export type SalesScope = "shift" | "history";

export const useSales = () => {
  const [sales, setSales] = useState<SaleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterId>("all");
  const [scope, setScope] = useState<SalesScope>("shift");
  const [cutoff, setCutoff] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const loadSales = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [data, cut] = await Promise.all([
        SalesService.getSales(),
        CashierService.getSalesCutoff(),
      ]);
      setSales(data);
      setCutoff(cut);
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
    useCallback(() => {
      loadSales();
    }, [loadSales]),
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSales(true);
  }, [loadSales]);

  // Ventas visibles según el alcance (turno actual o historial completo)
  const scopedSales = useMemo(() => {
    if (scope === "history" || !cutoff) return sales;
    const c = new Date(cutoff).getTime();
    return sales.filter(
      (s) => s.created_at && new Date(s.created_at).getTime() >= c,
    );
  }, [sales, scope, cutoff]);

  const filteredSales = useMemo(() => {
    // Los fiados pendientes se ven siempre, de cualquier día
    if (filter === "debt") return sales.filter((s) => s.is_debt);
    if (filter === "paid") return scopedSales.filter((s) => !s.is_debt);
    return scopedSales;
  }, [sales, scopedSales, filter]);

  const handleMarkAsPaid = useCallback(async (saleId: string) => {
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
              setSales((prev) =>
                prev.map((s) =>
                  s.id === saleId
                    ? { ...s, is_debt: false, debt_amount: 0 }
                    : s,
                ),
              );
            } catch (err) {
              Alert.alert(
                "Error",
                "No se pudo actualizar la venta. \n" + (err as Error).message,
              );
            } finally {
              setPayingId(null);
            }
          },
        },
      ],
    );
  }, []);

  return {
    sales, // TODAS (para calcular fiados pendientes)
    scopedSales, // las del turno o historial
    scope,
    setScope,
    isLoading,
    isRefreshing,
    filter,
    setFilter,
    payingId,
    setPayingId,
    selectedSaleId,
    setSelectedSaleId,
    loadSales,
    onRefresh,
    filteredSales,
    handleMarkAsPaid,
  };
};