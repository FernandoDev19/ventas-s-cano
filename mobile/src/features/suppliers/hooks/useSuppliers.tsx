import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { SuppliersService } from "../services/suppliers.service";
import { SupplierForm, SupplierType } from "../types/supplier.type";

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [payables, setPayables] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [list, pay] = await Promise.all([
        SuppliersService.getAll(),
        SuppliersService.getPayableTotals(),
      ]);
      setSuppliers(list);
      setPayables(pay);
    } catch (e) {
      console.error("Error cargando proveedores:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setIsRefreshing(true); loadData(); };

  const save = async (form: SupplierForm, editing: SupplierType | null) => {
    if (editing) await SuppliersService.update(editing.id, form);
    else await SuppliersService.create(form);
    await loadData();
  };

  const remove = (s: SupplierType) =>
    Alert.alert("Eliminar proveedor", `¿Eliminar a "${s.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive",
        onPress: async () => { await SuppliersService.delete(s.id); loadData(); },
      },
    ]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(q) || (s.products_supplied ?? "").toLowerCase().includes(q))
    : suppliers;
  const totalPayable = Object.values(payables).reduce((a, b) => a + b, 0);

  return { suppliers, filtered, payables, totalPayable, search, setSearch, isLoading, isRefreshing, onRefresh, save, remove };
};