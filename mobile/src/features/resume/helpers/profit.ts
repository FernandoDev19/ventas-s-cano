import { toLocalDateStr } from "@/src/shared/helpers/date.helper";

export function buildProfit(report: any, detail: any, expenses: any) {
  const revenue = report.totalSales;
  const gross = revenue - detail.totalCost;
  const net = gross - expenses.operating;
  const pct = (n: number) => (revenue > 0 ? (n / revenue) * 100 : 0);
  return {
    revenue, cost: detail.totalCost,
    gross, grossMargin: pct(gross),
    opex: expenses.operating,
    net, netMargin: pct(net),
    inversion: expenses.inversion,
    inventoryPurchases: expenses.inventoryPurchases,
    avgTicket: report.salesCount ? Math.round(revenue / report.salesCount) : 0,
    uncostedPct: revenue > 0 ? (detail.uncostedRevenue / revenue) * 100 : 0,
  };
}

export function dayRows(report: any, detail: any) {
  return report.salesByDay.map((d: any) => {
    const cost = detail.costByDay[d.dateStr] ?? 0;
    return { ...d, cost, profit: d.total - cost };
  });
}

/** Lo realmente cobrado por medio de pago (el fiado va aparte) */
export function paymentBreakdown(sales: any[]) {
  const out: Record<string, number> = { Efectivo: 0, Nequi: 0, Transferencia: 0, Tarjeta: 0, Fiado: 0 };
  for (const s of sales) {
    const m = String(s.payment_method ?? "cash").toLowerCase();
    const debt = s.is_debt ? (s.debt_amount ?? 0) : 0;
    out.Fiado += debt;
    const paid = s.total - debt;
    if (m === "deuda") continue;
    if (m === "cash" || m === "efectivo") out.Efectivo += paid;
    else if (m === "nequi") out.Nequi += paid;
    else if (m === "card") out.Tarjeta += paid;
    else out.Transferencia += paid;
  }
  return out;
}

/** Ventas por hora (0-23) para ver las horas pico */
export function hourBreakdown(sales: any[]) {
  const hours = Array.from({ length: 24 }, () => ({ total: 0, count: 0 }));
  for (const s of sales) {
    const h = new Date(s.created_at).getHours();
    hours[h].total += s.total; hours[h].count += 1;
  }
  return hours;
}