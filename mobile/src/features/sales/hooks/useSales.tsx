import { Alert } from "react-native";
import { SalesService } from "../services/sales.service";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SaleType } from "../types/sale.type";
import { FilterId } from "../components/SalesSummaryBar";

export const useSales = () => {
  const [sales, setSales] = useState<SaleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterId>("all");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

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
    useCallback(() => {
      loadSales();
    }, [loadSales]),
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
              // Update locally without re-fetching
              setSales((prev) =>
                prev.map((s) =>
                  s.id === saleId
                    ? { ...s, is_debt: false, debt_amount: 0 }
                    : s,
                ),
              );
            } catch (err) {
              Alert.alert("Error", "No se pudo actualizar la venta. \n" + (err as Error).message);
            } finally {
              setPayingId(null);
            }
          },
        },
      ],
    );
  }, []);

  return {
    sales,
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
