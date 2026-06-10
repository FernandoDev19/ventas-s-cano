// mobile/src/features/resume/services/export.service.ts
import { Paths, File } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

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
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const ExportService = {
  // ─── PDF ───────────────────────────────────────────────
  exportPDF: async (data: ReportData): Promise<void> => {
    const netProfit = data.totalSales - data.expenses.total;
    const profitColor = netProfit >= 0 ? "#22c55e" : "#ef4444";

    const topProductsRows = data.topProducts
      .map(
        (p, i) => `
      <tr>
        <td>#${i + 1}</td>
        <td>${p.name}</td>
        <td style="text-align:center">${p.quantity}</td>
        <td style="text-align:right">${formatCOP(p.total)}</td>
      </tr>
    `,
      )
      .join("");

    const salesByDayRows = data.salesByDay
      .map(
        (d) => `
      <tr>
        <td>${formatDate(d.dateStr)}</td>
        <td style="text-align:center">${d.count}</td>
        <td style="text-align:right">${formatCOP(d.total)}</td>
      </tr>
    `,
      )
      .join("");

    const expenseCatRows = data.expenses.byCategory
      .map(
        (c) => `
      <tr>
        <td>${c.category}</td>
        <td style="text-align:right" class="danger">-${formatCOP(c.total)}</td>
      </tr>
    `,
      )
      .join("");

    const salesRows = data.sales
      .slice(0, 20)
      .map(
        (s) => `
      <tr>
        <td>#${String(s.id).padStart(3, "0")}</td>
        <td>${s.note || "—"}</td>
        <td style="text-align:center">
          <span style="color:${s.is_debt ? "#f59e0b" : "#22c55e"}">
            ${s.is_debt ? "Fiado" : "Pagado"}
          </span>
        </td>
        <td style="text-align:right">${formatCOP(s.total)}</td>
      </tr>
    `,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
          
          .header { background: #ff5722; color: white; padding: 28px 32px; border-radius: 12px; margin-bottom: 32px; }
          .header h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
          .header p { opacity: 0.85; margin-top: 4px; font-size: 14px; }
          
          .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px; }
          .kpi { padding: 20px; border-radius: 12px; border: 1.5px solid #e5e7eb; }
          .kpi label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 700; }
          .kpi .value { font-size: 26px; font-weight: 900; margin-top: 6px; }
          .kpi.green { border-color: #bbf7d0; background: #f0fdf4; }
          .kpi.green .value { color: #16a34a; }
          .kpi.amber { border-color: #fde68a; background: #fffbeb; }
          .kpi.amber .value { color: #d97706; }
          .kpi.red { border-color: #fecaca; background: #fef2f2; }
          .kpi.red .value { color: #dc2626; }
          .kpi.primary { border-color: #fed7c3; background: #fff7f5; }
          .kpi.primary .value { color: #ff5722; }

          .section { margin-bottom: 32px; }
          .section h2 { font-size: 16px; font-weight: 800; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #f3f4f6; }
          
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #f9fafb; padding: 10px 12px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1.5px solid #e5e7eb; }
          td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
          tr:last-child td { border-bottom: none; }
          .danger { color: #dc2626; font-weight: 700; }

          .profit-box { padding: 20px 24px; border-radius: 12px; background: ${netProfit >= 0 ? "#f0fdf4" : "#fef2f2"}; border: 2px solid ${netProfit >= 0 ? "#86efac" : "#fca5a5"}; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; }
          .profit-box .label { font-size: 13px; color: #6b7280; font-weight: 600; }
          .profit-box .amount { font-size: 28px; font-weight: 900; color: ${profitColor}; }

          .footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FASTPOS — Reporte de Ventas</h1>
          <p>${formatDate(data.startDate)} al ${formatDate(data.endDate)}</p>
        </div>

        <div class="kpi-grid">
          <div class="kpi primary">
            <label>Total Ventas</label>
            <div class="value">${formatCOP(data.totalSales)}</div>
            <p style="color:#9ca3af;font-size:12px;margin-top:4px">${data.salesCount} ventas</p>
          </div>
          <div class="kpi green">
            <label>Cobrado</label>
            <div class="value">${formatCOP(data.totalPaid)}</div>
          </div>
          <div class="kpi amber">
            <label>Por cobrar (fiado)</label>
            <div class="value">${formatCOP(data.totalDebt)}</div>
          </div>
          <div class="kpi red">
            <label>Total Gastos</label>
            <div class="value">-${formatCOP(data.expenses.total)}</div>
          </div>
        </div>

        <div class="profit-box">
          <span class="label">Ganancia Neta del Período</span>
          <span class="amount">${netProfit >= 0 ? "" : "-"}${formatCOP(Math.abs(netProfit))}</span>
        </div>

        ${
          data.topProducts.length > 0
            ? `
        <div class="section">
          <h2>Top Productos</h2>
          <table>
            <thead><tr><th>#</th><th>Producto</th><th style="text-align:center">Unidades</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${topProductsRows}</tbody>
          </table>
        </div>`
            : ""
        }

        ${
          data.salesByDay.length > 0
            ? `
        <div class="section">
          <h2>Ventas por Día</h2>
          <table>
            <thead><tr><th>Fecha</th><th style="text-align:center">Ventas</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${salesByDayRows}</tbody>
          </table>
        </div>`
            : ""
        }

        ${
          data.expenses.byCategory.length > 0
            ? `
        <div class="section">
          <h2>Gastos por Categoría</h2>
          <table>
            <thead><tr><th>Categoría</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${expenseCatRows}</tbody>
          </table>
        </div>`
            : ""
        }

        ${
          data.sales.length > 0
            ? `
        <div class="section">
          <h2>Detalle de Ventas ${data.sales.length > 20 ? "(últimas 20)" : ""}</h2>
          <table>
            <thead><tr><th>#</th><th>Nota</th><th style="text-align:center">Estado</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${salesRows}</tbody>
          </table>
        </div>`
            : ""
        }

        <div class="footer">
          Generado por FASTPOS · ${new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    // Renombrar con fecha
    const fileName = `fastpos_reporte_${data.startDate}_${data.endDate}.pdf`;
    const file = new File(Paths.document, fileName);
    file.write(uri);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Exportar reporte PDF",
      });
    }
  },

  // ─── EXCEL ─────────────────────────────────────────────
  exportExcel: async (data: ReportData): Promise<void> => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen
    const resumen = [
      ["FASTPOS — Reporte de Ventas"],
      [`Período: ${formatDate(data.startDate)} al ${formatDate(data.endDate)}`],
      [],
      ["RESUMEN GENERAL"],
      ["Total Ventas", data.totalSales],
      ["Total Cobrado", data.totalPaid],
      ["Total Fiado", data.totalDebt],
      ["Total Gastos", data.expenses.total],
      ["Ganancia Neta", data.totalSales - data.expenses.total],
      ["Cantidad de Ventas", data.salesCount],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    
    wsResumen["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    // Hoja 2: Ventas por día
    if (data.salesByDay.length > 0) {
      const byDayData = [
        ["Fecha", "Cantidad Ventas", "Total"],
        ...data.salesByDay.map((d) => [
          formatDate(d.dateStr),
          d.count,
          d.total,
        ]),
      ];
      const wsByDay = XLSX.utils.aoa_to_sheet(byDayData);
      wsByDay["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsByDay, "Ventas por Día");
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
