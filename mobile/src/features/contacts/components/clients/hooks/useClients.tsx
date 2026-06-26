import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ContactsService } from "../../../services/contact.service";

export const useClients = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const debtors = await ContactsService.getDebtors();
      // También traer clientes sin deuda
      const all = await ContactsService.getClients();
      // Merge: deudores con info de deuda, el resto sin
      const debtorIds = new Set(debtors.map((d) => d.id));
      const nonDebtors = all
        .filter((c) => !debtorIds.has(c.id))
        .map((c) => ({ ...c, totalDebt: 0, salesCount: 0 }));
      setClients([...debtors, ...nonDebtors]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

    const debtors = clients.filter(c => c.totalDebt > 0);
    const totalDebt = debtors.reduce((s, c) => s + c.totalDebt, 0);

  return {
    clients,
    isLoading,
    isRefreshing,
    loadData,
    setIsRefreshing,
    debtors,
    totalDebt
  }
};
