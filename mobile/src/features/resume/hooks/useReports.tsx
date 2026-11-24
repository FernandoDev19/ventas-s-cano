import { useCallback, useState } from "react";
import { SalesService } from "../../sales/services/sales.service";
import ExpensesService from "../../expenses/services/expense.service";
import { ExportService } from "@/src/shared/services/export.service";
import { Alert } from "react-native";
import { PrinterService } from "@/src/shared/services/printer.service";

import { toLocalDateStr } from "@/src/shared/helpers/date.helper";
import { useFocusEffect } from "expo-router";
import { formatDate } from "../helpers/formatDate";

export const PRESETS = [
  {
    label: "Hoy",
    getDates: () => {
      const t = today();
      return { start: t, end: t };
    },
  },
  {
    label: "Ayer",
    getDates: () => {
      const d = daysAgo(1);
      return { start: d, end: d };
    },
  },
  { label: "7 días", getDates: () => ({ start: daysAgo(6), end: today() }) },
  {
    label: "Este mes",
    getDates: () => ({ start: firstOfMonth(), end: today() }),
  },
  {
    label: "Mes pasado",
    getDates: () => ({ start: firstOfLastMonth(), end: lastOfLastMonth() }),
  },
];

const today = () => toLocalDateStr();
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalDateStr(d);
};
const firstOfMonth = () => {
  const d = new Date();
  return toLocalDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
};
const firstOfLastMonth = () => {
  const d = new Date();
  return toLocalDateStr(new Date(d.getFullYear(), d.getMonth() - 1, 1));
};
const lastOfLastMonth = () => {
  const d = new Date();
  return toLocalDateStr(new Date(d.getFullYear(), d.getMonth(), 0));
};

export const useReports = () => {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [activePreset, setActivePreset] = useState("Este mes");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const loadReport = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const [salesReport, expensesReport] = await Promise.all([
        SalesService.getReportByRange(start, end),
        ExpensesService.getExpensesByRange(start, end),
      ]);
      setReport({ ...salesReport, expenses: expensesReport });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    const { start, end } = preset.getDates();
    setStartDate(start);
    setEndDate(end);
    setActivePreset(preset.label);
    loadReport(start, end);
  };

  const applyCustom = () => {
    setActivePreset("");
    loadReport(startDate, endDate);
  };

  useFocusEffect(
    useCallback(() => {
      const preset = PRESETS.find((p) => p.label === activePreset);
      if (!preset) return; // rango personalizado: se genera con el botón
      const { start, end } = preset.getDates();
      setStartDate(start);
      setEndDate(end);
      loadReport(start, end);
    }, [activePreset, loadReport]),
  );

  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | null>(null);

const handlePrintReport = async () => {
  try {
    if (!report) {
      Alert.alert("Aviso", "No hay datos para imprimir en este rango.");
      return;
    }

    const cajaConfig = await PrinterService.getConfig("caja");
    if (!cajaConfig.enabled) {
      Alert.alert("Aviso", "La impresora de caja está apagada.");
      return;
    }

    // Lo realmente cobrado por cada venta, separado en efectivo vs otros medios
    let cash = 0;
    let transfer = 0;
    for (const s of report.sales ?? []) {
      const method = String(s.payment_method ?? "cash").toLowerCase();
      if (method === "deuda") continue;
      const paid = s.total - (s.is_debt ? (s.debt_amount ?? 0) : 0);
      if (method === "cash" || method === "efectivo") cash += paid;
      else transfer += paid;
    }

    const reportPrintData = {
      title: "REPORTE DE VENTAS / CIERRE",
      dateRange: `${formatDate(startDate)} al ${formatDate(endDate)}`,
      totalOrders: report.salesCount || 0,
      averageTicket: report.salesCount
        ? Math.round(report.totalSales / report.salesCount)
        : 0,
      methods: {
        cash,
        transfer,
        debt: report.totalDebt || 0,
      },
      netProfit,
      topProducts: report.topProducts || [],
    };

    const ticketCmds = PrinterService.generateReportTicket(reportPrintData);
    await PrinterService.print("caja", ticketCmds);

    Alert.alert("Listo", "Reporte enviado a la impresora.");
  } catch (error) {
    Alert.alert(
      "Error",
      "No se pudo imprimir el reporte: " + (error as Error).message,
    );
  }
};

  const handleExport = async (type: "pdf" | "excel") => {
    if (!report) return;
    setIsExporting(type);
    try {
      const exportData = { startDate, endDate, ...report };
      if (type === "pdf") {
        await ExportService.exportPDF(exportData);
      } else {
        await ExportService.exportExcel(exportData);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo exportar el reporte.");
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  const netProfit = report ? report.totalSales - report.expenses.total : 0;

  return {
    netProfit,
    applyCustom,
    applyPreset,
    activePreset,
    startDate,
    endDate,
    showStartPicker,
    showEndPicker,
    isLoading,
    report,
    setShowStartPicker,
    setShowEndPicker,
    setStartDate,
    setEndDate,
    handleExport,
    isExporting,
    handlePrintReport,
  };
};
