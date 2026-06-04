export const STOCK_LOW_THRESHOLD = 10;
export const STOCK_CRITICAL_THRESHOLD = 3;

export function getStockStatus(stock: number): { label: string; color: string; bg: string } {
    if (stock <= STOCK_CRITICAL_THRESHOLD) return { label: "CRÍTICO", color: "#ef4444", bg: "#ef444422" };
    if (stock <= STOCK_LOW_THRESHOLD) return { label: "STOCK BAJO", color: "#f59e0b", bg: "#f59e0b22" };
    return { label: "ESTADO: OK", color: "#22c55e", bg: "#22c55e22" };
}