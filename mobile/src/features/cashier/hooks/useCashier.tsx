// mobile/src/features/cashier/hooks/useCashier.tsx
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { CashierService } from "../services/cashier.service";
import { CashierShiftType, CashMovement } from "../types/shift.type";

export const useCashier = () => {
  const [currentShift, setCurrentShift] = useState<CashierShiftType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [shiftHistory, setShiftHistory] = useState<CashierShiftType[]>([]);

  const loadCurrentShift = useCallback(async () => {
    try {
      const shift = await CashierService.getCurrentShift();
      setCurrentShift(shift);
      if (shift) {
        const movs = await CashierService.getShiftMovements(shift.id);
        setMovements(movs);
      } else {
        setMovements([]);
      }
    } catch (err) {
      console.error("Error cargando turno actual:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadShiftHistory = useCallback(async () => {
    try {
      const history = await CashierService.getShiftHistory();
      setShiftHistory(history);
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  }, []);

  useEffect(() => {
    loadCurrentShift();
    loadShiftHistory();
  }, [loadCurrentShift, loadShiftHistory]);

  const openShift = useCallback(
    async (balance: number, notes?: string) => {
      try {
        const shift = await CashierService.openShift(balance, notes);
        setCurrentShift(shift);
        setMovements([]);
        loadShiftHistory();
        return shift;
      } catch (err) {
        Alert.alert("Error", "No se pudo abrir el turno");
        console.error(err);
      }
    },
    [loadShiftHistory],
  );

  const addMovement = useCallback(
    async (
      type: "entry" | "exit",
      description: string,
      amount: number,
      notes?: string,
    ) => {
      if (!currentShift) {
        Alert.alert("Error", "No hay turno abierto");
        return;
      }
      try {
        const movement = await CashierService.addMovement(
          currentShift.id,
          type,
          description,
          amount,
          notes,
        );
        setMovements((prev) => [...prev, movement]);
        return movement;
      } catch (err) {
        Alert.alert("Error", "No se pudo registrar el movimiento");
        console.error(err);
      }
    },
    [currentShift],
  );

  const closeShift = useCallback(
    async (actualTotal: number, notes?: string) => {
      if (!currentShift) {
        Alert.alert("Error", "No hay turno abierto");
        return;
      }
      try {
        const closed = await CashierService.closeShift(
          currentShift.id,
          actualTotal,
          notes,
        );
        setCurrentShift(closed);
        loadShiftHistory();
        return closed;
      } catch (err) {
        Alert.alert("Error", "No se pudo cerrar el turno");
        console.error(err);
      }
    },
    [currentShift, loadShiftHistory],
  );

  const calculateTotals = useCallback(async () => {
    if (!currentShift) return null;
    try {
      return await CashierService.calculateShiftTotals(currentShift.id);
    } catch (err) {
      console.error("Error calculando totales:", err);
      return null;
    }
  }, [currentShift]);

  return {
    currentShift,
    movements,
    shiftHistory,
    isLoading,
    loadCurrentShift,
    loadShiftHistory,
    openShift,
    addMovement,
    closeShift,
    calculateTotals,
  };
};
