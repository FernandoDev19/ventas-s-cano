import { useEffect, useMemo, useState } from "react";
import { Chart } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { Customer, Expense, Sale } from "../../models";
import saleService from "../../services/sale.service";
import customerService from "../../services/customer.service";
import expenseService from "../../services/expense.service";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const getYear = (value?: string | Date) => {
  if (!value) return null;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return null;

  return d.getFullYear();
};

const getMonthIndex = (value?: string | Date) => {
  if (!value) return null;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return null;

  return d.getMonth();
};

const getDateFromObjectId = (id?: string) => {
  if (!id || id.length < 8) return null;

  const tsHex = id.substring(0, 8);
  const ts = Number.parseInt(tsHex, 16);

  if (Number.isNaN(ts)) return null;

  return new Date(ts * 1000);
};

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [salesData, customersData, expensesData] = await Promise.all([
          saleService.getSales(),
          customerService.getCustomers(),
          expenseService.getAllExpenses(),
        ]);
        setSales(salesData);
        setCustomers(customersData);
        setExpenses(expensesData);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar las estadísticas");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    sales.forEach((s) => {
      const y = getYear(s.createdAt);
      if (y) years.add(y);
    });

    expenses.forEach((e) => {
      const y = getYear(e.date);
      if (y) years.add(y);
    });

    customers.forEach((c) => {
      const d = getDateFromObjectId(c._id);
      if (!d) return;
      years.add(d.getFullYear());
    });

    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [customers, currentYear, expenses, sales]);

  const { salesByMonth, newCustomersByMonth, expensesByMonth } = useMemo(() => {
    const s = Array(12).fill(0) as number[];
    const c = Array(12).fill(0) as number[];
    const e = Array(12).fill(0) as number[];

    sales.forEach((sale) => {
      if (getYear(sale.createdAt) !== selectedYear) return;
      
      const m = getMonthIndex(sale.createdAt);
      if (m === null) return;
      s[m] += sale.total || 0;
    });

    expenses.forEach((expense) => {
      if (getYear(expense.date) !== selectedYear) return;
      const m = getMonthIndex(expense.date);
      if (m === null) return;
      e[m] += expense.amount || 0;
    });

    customers.forEach((customer) => {
      const d = getDateFromObjectId(customer._id);
      if (!d) return;
      if (d.getFullYear() !== selectedYear) return;
      c[d.getMonth()] += 1;
    });

    return {
      salesByMonth: s,
      newCustomersByMonth: c,
      expensesByMonth: e,
    };
  }, [customers, expenses, sales, selectedYear]);

  const netProfitByMonth = useMemo(() => {
    return salesByMonth.map((value, idx) => value - expensesByMonth[idx]);
  }, [expensesByMonth, salesByMonth]);

  const kpis = useMemo(() => {
    const totalSales = salesByMonth.reduce((acc, v) => acc + v, 0);
    const totalExpenses = expensesByMonth.reduce((acc, v) => acc + v, 0);
    const netProfit = totalSales - totalExpenses;

    const yearSales = sales.filter((s) => getYear(s.createdAt) === selectedYear);
    const cashSales = yearSales
      .filter((s) => !s.isDebt)
      .reduce((acc, s) => acc + (s.total || 0), 0);
    const creditSales = yearSales
      .filter((s) => s.isDebt)
      .reduce((acc, s) => acc + (s.debtAmount ?? s.total ?? 0), 0);

    const paymentBase = cashSales + creditSales;
    const cashPct = paymentBase > 0 ? (cashSales / paymentBase) * 100 : 0;
    const creditPct = paymentBase > 0 ? (creditSales / paymentBase) * 100 : 0;

    return {
      totalSales,
      totalExpenses,
      netProfit,
      cashSales,
      creditSales,
      cashPct,
      creditPct,
    };
  }, [expensesByMonth, sales, salesByMonth, selectedYear]);

  const commonOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: "top" as const },
      },
    }),
    []
  );

  const salesData = useMemo(
    () => ({
      labels: MONTHS,
      datasets: [
        {
          label: `Ventas (${selectedYear})`,
          data: salesByMonth,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [salesByMonth, selectedYear]
  );

  const customersData = useMemo(
    () => ({
      labels: MONTHS,
      datasets: [
        {
          label: `Clientes nuevos (${selectedYear})`,
          data: newCustomersByMonth,
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "#16a34a",
          borderWidth: 1,
        },
      ],
    }),
    [newCustomersByMonth, selectedYear]
  );

  const expensesData = useMemo(
    () => ({
      labels: MONTHS,
      datasets: [
        {
          label: `Gastos (${selectedYear})`,
          data: expensesByMonth,
          backgroundColor: "rgba(239, 68, 68, 0.6)",
          borderColor: "#dc2626",
          borderWidth: 1,
        },
      ],
    }),
    [expensesByMonth, selectedYear]
  );

  const netProfitData = useMemo(
    () => ({
      labels: MONTHS,
      datasets: [
        {
          label: `Ganancia neta (${selectedYear})`,
          data: netProfitByMonth,
          borderColor: "#0f766e",
          backgroundColor: "rgba(13, 148, 136, 0.25)",
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [netProfitByMonth, selectedYear]
  );

  const paymentMixData = useMemo(
    () => ({
      labels: ["Efectivo", "Crédito (por cobrar)"],
      datasets: [
        {
          label: "Mix de pagos",
          data: [kpis.cashSales, kpis.creditSales],
          backgroundColor: ["rgba(34, 197, 94, 0.7)", "rgba(245, 158, 11, 0.75)"],
          borderColor: ["#16a34a", "#d97706"],
          borderWidth: 1,
        },
      ],
    }),
    [kpis.cashSales, kpis.creditSales]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-3xl font-bold text-primary">Estadísticas</h1>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Año</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Ventas ({selectedYear})</div>
          <div className="text-2xl font-bold text-blue-600">
            ${kpis.totalSales.toLocaleString()} COP
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Gastos ({selectedYear})</div>
          <div className="text-2xl font-bold text-red-600">
            ${kpis.totalExpenses.toLocaleString()} COP
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Ganancia neta ({selectedYear})</div>
          <div
            className={`text-2xl font-bold ${
              kpis.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            ${kpis.netProfit.toLocaleString()} COP
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Mix de pagos</div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-sm">
              <span>Efectivo</span>
              <span className="font-semibold">{kpis.cashPct.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Crédito (por cobrar)</span>
              <span className="font-semibold">{kpis.creditPct.toFixed(0)}%</span>
            </div>
            <div className="pt-2 mt-2 border-t text-sm flex justify-between">
              <span className="text-gray-600">Por cobrar</span>
              <span className="font-semibold text-yellow-700">
                ${kpis.creditSales.toLocaleString()} COP
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Ventas por mes</h2>
          <Chart type="line" data={salesData} options={commonOptions} datasetIdKey="ventas" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Ganancia neta por mes (Ventas - Gastos)</h2>
          <Chart type="line" data={netProfitData} options={commonOptions} datasetIdKey="ganancia" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Clientes nuevos por mes</h2>
          <Chart type="bar" data={customersData} options={commonOptions} datasetIdKey="clientes" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">% Efectivo vs % Crédito</h2>
          <Chart style={{ maxHeight: 'auto' }} type="doughnut" data={paymentMixData} options={commonOptions} datasetIdKey="mix" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Gastos por mes</h2>
          <Chart type="bar" data={expensesData} options={commonOptions} datasetIdKey="gastos" />
        </div>
      </div>
    </div>
  );
}
