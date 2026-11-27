export function getMargin(price: number, cost?: number) {
  const c = cost ?? 0;
  if (!c || !price) return { hasCost: false, profit: 0, pct: 0, color: "#737373" };
  const profit = price - c;
  const pct = (profit / price) * 100;
  const color = profit < 0 ? "#ef4444" : pct < 20 ? "#f59e0b" : "#22c55e";
  return { hasCost: true, profit, pct, color };
}