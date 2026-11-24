import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { toLocalDateStr } from "../helpers/date.helper";
import { ProductsService } from "@/src/features/inventory/services/products.service";
import { CategoriesService } from "@/src/features/categories/services/categories.service";
import { ClientsService } from "@/src/features/clients/services/clients.service";
import { SalesService } from "@/src/features/sales/services/sales.service";
import { EmployeesService } from "@/src/features/employees/services/employees.service";
import { PayrollService } from "@/src/features/employees/services/payroll.service";
import { SuppliersService } from "@/src/features/suppliers/services/suppliers.service";
import { ExpenseType } from "@/src/features/expenses/types/expense.type";
import { CategoryType } from "@/src/features/categories/types/category.type";

type Cell = string | number | null;
type Sheet = { name: string; rows: Cell[][]; widths?: number[] };

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function shareWorkbook(fileName: string, sheets: Sheet[]) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    if (s.widths) ws["!cols"] = s.widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const file = new File(Paths.document, `${fileName}.xlsx`);
  file.write(b64, { encoding: "base64" });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: XLSX_MIME,
      dialogTitle: "Exportar",
    });
  }
}

const day = (d: Date | string | null | undefined) =>
  d ? toLocalDateStr(d) : "";

export const ExportDataService = {
  // ─── Inventario ─────────────────────────────
  inventory: async () => {
    const [products, cats] = await Promise.all([
      ProductsService.getProducts(),
      CategoriesService.getAll(),
    ]);
    const catName = new Map(cats.map((c) => [c.id, c.name]));
    const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);

    await shareWorkbook(`inventario_${toLocalDateStr()}`, [
      {
        name: "Inventario",
        widths: [30, 22, 12, 10, 16, 12],
        rows: [
          ["Producto", "Categoría", "Precio", "Stock", "Valor en stock", "En menú web"],
          ...products.map((p) => [
            p.name,
            catName.get(p.category_id) ?? "",
            p.price,
            p.stock,
            p.price * p.stock,
            p.is_visible_menu ? "Sí" : "No",
          ]),
          [],
          ["TOTAL", "", "", "", totalValue, ""],
        ],
      },
    ]);
  },

  // ─── Clientes y fiados ──────────────────────
  clientsAndDebts: async () => {
    const [clients, debtors, debtSales] = await Promise.all([
      ClientsService.getAll(),
      ClientsService.getDebtors(),
      SalesService.getDebtSales(),
    ]);
    const debtByClient = new Map(debtors.map((d) => [d.id, d.totalDebt]));
    const totalDebt = debtSales.reduce((s, x) => s + (x.debt_amount ?? 0), 0);

    await shareWorkbook(`clientes_fiados_${toLocalDateStr()}`, [
      {
        name: "Fiados pendientes",
        widths: [26, 14, 14, 16, 16],
        rows: [
          ["Cliente", "Fecha venta", "Vence", "Total venta", "Debe"],
          ...debtSales.map((s) => [
            s.client?.name ?? "Sin cliente",
            day(s.created_at),
            day(s.debt_date),
            s.total,
            s.debt_amount ?? 0,
          ]),
          [],
          ["TOTAL POR COBRAR", "", "", "", totalDebt],
        ],
      },
      {
        name: "Clientes",
        widths: [26, 16, 28, 16],
        rows: [
          ["Nombre", "Teléfono", "Notas", "Deuda actual"],
          ...clients.map((c) => [
            c.name,
            c.phone ?? "",
            c.notes ?? "",
            debtByClient.get(c.id) ?? 0,
          ]),
        ],
      },
    ]);
  },

  // ─── Gastos (exporta lo que el usuario está viendo filtrado) ───
  expenses: async (expenses: ExpenseType[], categories: CategoryType[]) => {
    const catName = new Map(categories.map((c) => [c.id, c.name]));
    const total = expenses.reduce((s, e) => s + e.amount, 0);

    await shareWorkbook(`gastos_${toLocalDateStr()}`, [
      {
        name: "Gastos",
        widths: [12, 34, 18, 12, 14, 10, 14, 14, 12],
        rows: [
          ["Fecha", "Descripción", "Categoría", "Tipo", "Monto", "Pagado", "Método", "Factura", "Vence"],
          ...expenses.map((e) => [
            day(e.date),
            e.description,
            catName.get(e.category_id ?? "") ?? "",
            e.kind ?? "operativo",
            e.amount,
            e.is_paid === 0 ? "No" : "Sí",
            e.payment_method ?? "",
            e.invoice_number ?? "",
            e.due_date ?? "",
          ]),
          [],
          ["TOTAL", "", "", "", total],
        ],
      },
    ]);
  },

  // ─── Empleados y nómina ─────────────────────
  payroll: async () => {
    const [emps, history] = await Promise.all([
      EmployeesService.getAll(),
      PayrollService.getHistory(1000),
    ]);

    await shareWorkbook(`nomina_${toLocalDateStr()}`, [
      {
        name: "Pagos de nómina",
        widths: [26, 12, 12, 14, 12, 12, 14, 12],
        rows: [
          ["Empleado", "Desde", "Hasta", "Base", "Bonos", "Descuentos", "Neto", "Pagado el"],
          ...history.map((p) => [
            p.employee_name ?? "Eliminado",
            p.period_start,
            p.period_end,
            p.base_amount,
            p.bonuses,
            p.deductions,
            p.net_amount,
            day(p.paid_at),
          ]),
        ],
      },
      {
        name: "Empleados",
        widths: [26, 18, 12, 14, 10],
        rows: [
          ["Nombre", "Cargo", "Se paga", "Pago base", "Activo"],
          ...emps.map((e) => [
            e.name,
            e.role ?? "",
            e.pay_type,
            e.base_salary,
            e.is_active ? "Sí" : "No",
          ]),
        ],
      },
    ]);
  },

  // ─── Proveedores y cuentas por pagar ────────
  suppliers: async () => {
    const [list, payables] = await Promise.all([
      SuppliersService.getAll(),
      SuppliersService.getPayableTotals(),
    ]);
    await shareWorkbook(`proveedores_${toLocalDateStr()}`, [
      {
        name: "Proveedores",
        widths: [26, 20, 16, 28, 14, 16],
        rows: [
          ["Proveedor", "Contacto", "Teléfono", "Qué vende", "Días crédito", "Por pagar"],
          ...list.map((s) => [
            s.name,
            s.contact_name ?? "",
            s.phone ?? "",
            s.products_supplied ?? "",
            s.payment_terms_days ?? 0,
            payables[s.id] ?? 0,
          ]),
        ],
      },
    ]);
  },
};