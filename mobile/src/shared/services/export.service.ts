// mobile/src/features/resume/services/export.service.ts
import { Paths, File } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { parseLocalDate } from "../helpers/date.helper";

type ReportData = {
  startDate: string;
  endDate: string;
  totalSales: number;
  totalPaid: number;
  totalDebt: number;
  salesCount: number;
  expenses: {
    total: number;
    byCategory: { category: string; total: number }[];
  };
  topProducts: { name: string; quantity: number; total: number }[];
  salesByDay: { dateStr: string; total: number; count: number }[];
  sales: any[];
  profit: any;
  detail: any;
  days: any;
  payments: any;
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(str: string) {
  return parseLocalDate(str).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const ExportService = {
  // ─── PDF ───────────────────────────────────────────────
  exportPDF: async (data: ReportData): Promise<void> => {
    const esc = (s: any) =>
      String(s ?? "").replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
      );
    const p = data.profit;
    const money = (n: number) => (n < 0 ? "-" : "") + formatCOP(Math.abs(n));

    const row = (label: string, value: string, cls = "") =>
      `<tr class="${cls}"><td>${label}</td><td class="r">${value}</td></tr>`;

    const productRows = data.detail.products
      .slice(0, 15)
      .map(
        (x: any, i: number) => `
  <tr><td>${i + 1}</td><td>${esc(x.name)}</td><td class="c">${x.quantity}</td>
  <td class="r">${formatCOP(x.revenue)}</td><td class="r">${formatCOP(x.cost)}</td>
  <td class="r ${x.profit < 0 ? "neg" : "pos"}">${money(x.profit)}</td>
  <td class="c">${x.margin.toFixed(0)}%</td></tr>`,
      )
      .join("");

    const dayRowsHtml = data.days
      .map(
        (d: any) => `
  <tr><td>${formatDate(d.dateStr)}</td><td class="c">${d.count}</td>
  <td class="r">${formatCOP(d.total)}</td><td class="r">${formatCOP(d.cost)}</td>
  <td class="r ${d.profit < 0 ? "neg" : "pos"}">${money(d.profit)}</td></tr>`,
      )
      .join("");

    const payRows = Object.entries(data.payments)
      .map(([k, v]) => row(k, formatCOP(v as number)))
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1f2937;padding:36px;font-size:12px}
  .top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #ff5722;padding-bottom:14px;margin-bottom:22px}
  .top h1{font-size:24px;font-weight:900;color:#ff5722}
  .top .meta{text-align:right;color:#6b7280;font-size:11px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
  .kpi{border:1px solid #e5e7eb;border-radius:10px;padding:12px}
  .kpi label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:700}
  .kpi .v{font-size:18px;font-weight:900;margin-top:4px}
  .kpi.net{background:${p.net >= 0 ? "#f0fdf4" : "#fef2f2"};border-color:${p.net >= 0 ? "#86efac" : "#fca5a5"}}
  h2{font-size:13px;font-weight:800;margin:20px 0 8px;padding-bottom:5px;border-bottom:1px solid #e5e7eb;text-transform:uppercase;letter-spacing:.5px}
  table{width:100%;border-collapse:collapse}
  th{background:#f9fafb;padding:7px 8px;text-align:left;font-size:9px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb}
  td{padding:7px 8px;border-bottom:1px solid #f3f4f6}
  .r{text-align:right}.c{text-align:center}
  .pos{color:#16a34a;font-weight:700}.neg{color:#dc2626;font-weight:700}
  .total td{font-weight:800;background:#f9fafb;border-top:1.5px solid #d1d5db}
  .memo td{color:#6b7280;font-style:italic}
  .note{margin-top:8px;font-size:10px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;padding:8px;border-radius:6px}
  .footer{margin-top:28px;text-align:center;color:#9ca3af;font-size:10px;border-top:1px solid #f3f4f6;padding-top:12px}
</style></head><body>
  <div class="top">
    <div><h1>Sabor Express</h1><div style="color:#6b7280">Reporte de gestión</div></div>
    <div class="meta">${formatDate(data.startDate)} — ${formatDate(data.endDate)}<br/>${data.salesCount} ventas · ticket promedio ${formatCOP(p.avgTicket)}</div>
  </div>

  <div class="kpis">
    <div class="kpi"><label>Ventas</label><div class="v">${formatCOP(p.revenue)}</div></div>
    <div class="kpi"><label>Utilidad bruta · ${p.grossMargin.toFixed(1)}%</label><div class="v">${money(p.gross)}</div></div>
    <div class="kpi"><label>Gastos operativos</label><div class="v">${formatCOP(p.opex)}</div></div>
    <div class="kpi net"><label>Utilidad neta · ${p.netMargin.toFixed(1)}%</label><div class="v" style="color:${p.net >= 0 ? "#16a34a" : "#dc2626"}">${money(p.net)}</div></div>
  </div>

  <h2>Estado de resultados</h2>
  <table>
    ${row("Ventas", formatCOP(p.revenue))}
    ${row("(−) Costo de ventas", "-" + formatCOP(p.cost))}
    ${row("= Utilidad bruta", money(p.gross), "total")}
    ${row("(−) Gastos operativos (incluye nómina)", "-" + formatCOP(p.opex))}
    ${row("= Utilidad neta", money(p.net), "total")}
    ${row("Compras de inventario (ya incluidas en el costo al vender)", formatCOP(p.inventoryPurchases), "memo")}
    ${row("Inversión en activos (no afecta la utilidad operativa)", formatCOP(p.inversion), "memo")}
  </table>
  ${p.uncostedPct > 0 ? `<div class="note">El ${p.uncostedPct.toFixed(0)}% de lo vendido no tiene costo cargado; la utilidad real es menor.</div>` : ""}

  <h2>Rentabilidad por producto</h2>
  <table><thead><tr><th>#</th><th>Producto</th><th class="c">Uds</th><th class="r">Vendido</th><th class="r">Costo</th><th class="r">Utilidad</th><th class="c">Margen</th></tr></thead>
  <tbody>${productRows}</tbody></table>

  <h2>Resultado por día</h2>
  <table><thead><tr><th>Fecha</th><th class="c">Ventas</th><th class="r">Vendido</th><th class="r">Costo</th><th class="r">Utilidad</th></tr></thead>
  <tbody>${dayRowsHtml}</tbody></table>

  <h2>Cobros por medio de pago</h2>
  <table>${payRows}</table>

  <div class="footer">Sabor Express · generado el ${new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</div>
</body></html>`;

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Exportar reporte PDF",
      });
    }
  },

  // ─── EXCEL ─────────────────────────────────────────────
  exportExcel: async (data: ReportData): Promise<void> => {
    const wb = XLSX.utils.book_new();
    const p = data.profit ?? {};

    // Hoja 1: Resumen (primera pestaña al abrir)
    const resumen = [
      ["Sabor Express — Reporte de gestión"],
      [`Período: ${formatDate(data.startDate)} al ${formatDate(data.endDate)}`],
      [],
      ["ESTADO DE RESULTADOS"],
      ["Ventas", p.revenue ?? 0],
      ["(-) Costo de ventas", p.cost ?? 0],
      ["Utilidad bruta", p.gross ?? 0],
      ["Margen bruto %", Number((p.grossMargin ?? 0).toFixed(1))],
      ["(-) Gastos operativos", p.opex ?? 0],
      ["Utilidad neta", p.net ?? 0],
      ["Margen neto %", Number((p.netMargin ?? 0).toFixed(1))],
      [],
      ["Cobrado", data.totalPaid ?? 0],
      ["Por cobrar (fiado)", data.totalDebt ?? 0],
      ["Compras de inventario (informativo)", p.inventoryPurchases ?? 0],
      ["Inversión (informativo)", p.inversion ?? 0],
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    wsResumen["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    // Hoja 2: Rentabilidad por producto
    const products = data.detail?.products ?? [];
    if (products.length > 0) {
      const wsProfit = XLSX.utils.aoa_to_sheet([
        ["Producto", "Unidades", "Vendido", "Costo", "Utilidad", "Margen %"],
        ...products.map((x: any) => [
          x.name,
          x.quantity ?? 0,
          x.revenue ?? 0,
          x.cost ?? 0,
          x.profit ?? 0,
          Number((x.margin ?? 0).toFixed(1)),
        ]),
      ]);
      wsProfit["!cols"] = [
        { wch: 30 },
        { wch: 10 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, wsProfit, "Rentabilidad");
    }
    // Hoja 3: Detalle ventas
    if (data.sales.length > 0) {
      const salesData = [
        ["ID", "Nota", "Estado", "Total", "Deuda", "Fecha"],
        ...data.sales.map((s) => [
          `#${String(s.id).padStart(3, "0")}`,
          s.note || "",
          s.is_debt ? "Fiado" : "Pagado",
          s.total,
          s.debt_amount || 0,
          s.created_at
            ? new Date(s.created_at).toLocaleDateString("es-CO")
            : "",
        ]),
      ];
      const wsSales = XLSX.utils.aoa_to_sheet(salesData);
      wsSales["!cols"] = [
        { wch: 8 },
        { wch: 30 },
        { wch: 10 },
        { wch: 16 },
        { wch: 16 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSales, "Ventas");
    }

    // Hoja 4: Top productos
    if (data.topProducts.length > 0) {
      const prodsData = [
        ["Producto", "Unidades Vendidas", "Total"],
        ...data.topProducts.map((p) => [p.name, p.quantity, p.total]),
      ];
      const wsProds = XLSX.utils.aoa_to_sheet(prodsData);
      wsProds["!cols"] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsProds, "Productos");
    }

    // Hoja 5: Gastos
    if (data.expenses.byCategory.length > 0) {
      const expData = [
        ["Categoría", "Total Gastos"],
        ...data.expenses.byCategory.map((c) => [c.category, c.total]),
        [],
        ["TOTAL", data.expenses.total],
      ];
      const wsExp = XLSX.utils.aoa_to_sheet(expData);
      wsExp["!cols"] = [{ wch: 30 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsExp, "Gastos");
    }

    // Guardar y compartir
    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const fileName = `fastpos_reporte_${data.startDate}_${data.endDate}.xlsx`;
    const file = new File(Paths.document, fileName);

    file.write(wbout, {
      encoding: "base64",
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Exportar reporte Excel",
      });
    }
  },
};
