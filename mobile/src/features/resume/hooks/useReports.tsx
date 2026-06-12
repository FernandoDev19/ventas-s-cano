import { useCallback, useState } from "react";
import { SalesService } from "../../sales/services/sales.service";
import ExpensesService from "../../expenses/services/expense.service";
import { ExportService } from "@/src/shared/services/export.service";
import { Alert } from "react-native";

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

function today() {
  return new Date().toISOString().split("T")[0];
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function firstOfLastMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1)
    .toISOString()
    .split("T")[0];
}
function lastOfLastMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split("T")[0];
}

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

  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | null>(null);

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
  };
};
