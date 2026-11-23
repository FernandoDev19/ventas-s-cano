import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { toLocalDateStr } from "@/src/shared/helpers/date.helper";
import { EmployeesService } from "../services/employees.service";
import { PayForm, PayrollService } from "../services/payroll.service";
import { EmployeeForm, EmployeeType, PayrollPaymentType } from "../types/employee.type";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [history, setHistory] = useState<PayrollPaymentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [emps, hist] = await Promise.all([EmployeesService.getAll(), PayrollService.getHistory()]);
      setEmployees(emps);
      setHistory(hist);
    } catch (e) {
      console.error("Error cargando empleados:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setIsRefreshing(true); loadData(); };

  const saveEmployee = async (form: EmployeeForm, editing: EmployeeType | null) => {
    if (editing) await EmployeesService.update(editing.id, form);
    else await EmployeesService.create(form);
    await loadData();
  };

  const removeEmployee = async (emp: EmployeeType) => {
    if (await EmployeesService.hasPayments(emp.id)) {
      Alert.alert(
        "No se puede eliminar",
        `${emp.name} tiene pagos de nómina registrados. Mejor desactívalo desde su ficha para conservar el historial.`,
      );
      return;
    }
    Alert.alert("Eliminar empleado", `¿Eliminar a "${emp.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { await EmployeesService.delete(emp.id); loadData(); } },
    ]);
  };

  const payEmployee = async (emp: EmployeeType, form: PayForm) => {
    await PayrollService.pay(emp.id, emp.name, form);
    await loadData();
  };

  const cancelPayment = (p: PayrollPaymentType) =>
    Alert.alert(
      "Anular pago",
      "Se anulará el pago y también el gasto de nómina asociado. ¿Continuar?",
      [
        { text: "No", style: "cancel" },
        { text: "Anular", style: "destructive", onPress: async () => { await PayrollService.cancelPayment(p); loadData(); } },
      ],
    );

  const thisMonth = toLocalDateStr().slice(0, 7);
  const paidThisMonth = history
    .filter((h) => toLocalDateStr(h.paid_at).slice(0, 7) === thisMonth)
    .reduce((sum, h) => sum + h.net_amount, 0);
  const activeCount = employees.filter((e) => e.is_active === 1).length;

  return {
    employees, history, isLoading, isRefreshing, onRefresh,
    saveEmployee, removeEmployee, payEmployee, cancelPayment,
    paidThisMonth, activeCount,
  };
};