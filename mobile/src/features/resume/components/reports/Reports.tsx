// @theme-migrated
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { formatDate } from "../../helpers/formatDate";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/core/theme/palette";

const Stat = ({ label, value, color = C.text, sub }: any) => (
  <View style={{ flex: 1, padding: 14, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line }}>
    <Text style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", fontWeight: "700" }}>{label}</Text>
    <Text style={{ color, fontSize: 20, fontWeight: "800", marginTop: 4 }}>{value}</Text>
    {!!sub && <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{sub}</Text>}
  </View>
);

export function ProfitSummary({ p, totalPaid, totalDebt }: { p: any; totalPaid: number; totalDebt: number }) {
  const netColor = p.net >= 0 ? C.okText : C.dangerText;
  return (
    <View style={{ marginHorizontal: 16, gap: 10, marginBottom: 16 }}>
      <View style={{ padding: 18, borderRadius: 16, backgroundColor: C.card, borderLeftWidth: 4,
                     borderLeftColor: p.net >= 0 ? "#22c55e" : "#ef4444" }}>
        <Text style={{ color: C.muted, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Utilidad neta</Text>
        <Text style={{ color: netColor, fontSize: 36, fontWeight: "900" }}>
          {p.net < 0 ? "-" : ""}{priceFormat(Math.abs(p.net))}
        </Text>
        <Text style={{ color: C.muted, fontSize: 14 }}>
          Margen neto {p.netMargin.toFixed(1)}% · ticket promedio {priceFormat(p.avgTicket)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Ventas" value={priceFormat(p.revenue)} />
        <Stat label="Costo de ventas" value={`-${priceFormat(p.cost)}`} color={C.dangerText} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Utilidad bruta" value={priceFormat(p.gross)} color={C.okText} sub={`Margen ${p.grossMargin.toFixed(1)}%`} />
        <Stat label="Gastos operativos" value={`-${priceFormat(p.opex)}`} color={C.dangerText} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Cobrado" value={priceFormat(totalPaid)} color="#22c55e" />
        <Stat label="Por cobrar (fiado)" value={priceFormat(totalDebt)} color="#f59e0b" />
      </View>

      {(p.inventoryPurchases > 0 || p.inversion > 0) && (
        <Text style={{ color: C.muted, fontSize: 13 }}>
          Informativo (no resta de la utilidad): compras de inventario {priceFormat(p.inventoryPurchases)} · inversión {priceFormat(p.inversion)}
        </Text>
      )}
      {p.uncostedPct > 0 && (
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: C.warnBg, borderWidth: 1, borderColor: C.warnLine }}>
          <Text style={{ color: C.warnText, fontSize: 14, fontWeight: "600" }}>
            {p.uncostedPct.toFixed(0)}% de lo vendido no tiene costo cargado; la utilidad real es menor a la mostrada.
          </Text>
        </View>
      )}
    </View>
  );
}

export function ProductProfitList({ items }: { items: any[] }) {
  if (!items.length) return null;
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: C.card,
                   borderRadius: 16, borderWidth: 1, borderColor: C.line }}>
      <Text style={{ color: C.text, fontWeight: "700", fontSize: 17, marginBottom: 12 }}>Rentabilidad por producto</Text>
      {items.slice(0, 15).map((p) => {
        const color = p.profit < 0 ? C.dangerText : p.margin < 20 ? C.warnText : C.okText;
        return (
          <View key={p.name} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                                      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: C.text, fontWeight: "600" }} numberOfLines={1}>{p.name}</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>{p.quantity} uds · vendido {priceFormat(p.revenue)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color, fontWeight: "800" }}>{priceFormat(p.profit)}</Text>
              <Text style={{ color, fontSize: 13 }}>{p.margin.toFixed(0)}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

type Props = {
  report: any;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  isExporting: "pdf" | "excel" | null;
  handleExport: (type: "pdf" | "excel") => void;
  netProfit: number;
  handlePrint: () => void;
};

export default function Reports({
  report,
  startDate,
  endDate,
  isLoading,
  isExporting,
  handleExport,
  netProfit,
  handlePrint,
}: Props) {
  return (
    <>
      {isLoading ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator size="large" color="#ff5722" />
          <Text style={{ color: C.muted, marginTop: 12 }}>
            Calculando reporte...
          </Text>
        </View>
      ) : report ? (
        <View>
          {/* Período */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons name="time-outline" size={14} color={C.muted} />
            <Text style={{ color: C.muted, fontSize: 15 }}>
              {formatDate(startDate)} — {formatDate(endDate)}
            </Text>
          </View>

          {report && (
            <View
              style={{
                flexDirection: "row",
                marginHorizontal: 16,
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Pressable
                onPress={() => handleExport("pdf")}
                disabled={isExporting !== null}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#ef444415",
                  borderWidth: 1,
                  borderColor: "#ef444433",
                  opacity: isExporting !== null ? 0.6 : 1,
                }}
              >
                {isExporting === "pdf" ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#ef4444"
                  />
                )}
                <Text style={{ color: "#ef4444", fontWeight: "700" }}>PDF</Text>
              </Pressable>

              <Pressable
                onPress={() => handleExport("excel")}
                disabled={isExporting !== null}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#22c55e15",
                  borderWidth: 1,
                  borderColor: "#22c55e33",
                  opacity: isExporting !== null ? 0.6 : 1,
                }}
              >
                {isExporting === "excel" ? (
                  <ActivityIndicator size="small" color="#22c55e" />
                ) : (
                  <Ionicons name="grid-outline" size={18} color="#22c55e" />
                )}
                <Text style={{ color: "#22c55e", fontWeight: "700" }}>
                  Excel
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePrint}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#ff572215",
                  borderWidth: 1,
                  borderColor: "#ff572233",
                }}
              >
                <Ionicons name="print-outline" size={18} color="#ff5722" />
                <Text style={{ color: "#ff5722", fontWeight: "700" }}>
                  Imprimir
                </Text>
              </Pressable>
            </View>
          )}

          {/* KPIs principales */}
          <ProfitSummary p={report.profit} totalPaid={report.totalPaid} totalDebt={report.totalDebt} />

          {/* Top productos */}
          <ProductProfitList items={report.detail.products} />

          {/* Gastos por categoría */}
          {report.expenses.byCategory.length > 0 && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                padding: 16,
                backgroundColor: C.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.line,
              }}
            >
              <Text
                style={{
                  color: C.text,
                  fontWeight: "700",
                  fontSize: 17,
                  marginBottom: 12,
                }}
              >
                Gastos por Categoría
              </Text>
              {report.expenses.byCategory.map((cat: any) => {
                const maxCat = report.expenses.byCategory[0].total;
                const pct = (cat.total / maxCat) * 100;
                return (
                  <View key={cat.category} style={{ marginBottom: 10 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ color: C.soft, fontSize: 15 }}>
                        {cat.category}
                      </Text>
                      <Text
                        style={{
                          color: "#ef4444",
                          fontSize: 15,
                          fontWeight: "700",
                        }}
                      >
                        -{priceFormat(cat.total)}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: C.line,
                        borderRadius: 2,
                      }}
                    >
                      <View
                        style={{
                          height: 4,
                          backgroundColor: "#ef4444",
                          borderRadius: 2,
                          width: `${pct}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Ventas por día */}
          {report.salesByDay.length > 0 && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                padding: 16,
                backgroundColor: C.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.line,
              }}
            >
              <Text
                style={{
                  color: C.text,
                  fontWeight: "700",
                  fontSize: 17,
                  marginBottom: 12,
                }}
              >
                Ventas por Día
              </Text>
              {report.salesByDay.map((day: any) => (
                <View
                  key={day.dateStr}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: C.line,
                  }}
                >
                  <Text style={{ color: C.soft, fontSize: 15 }}>
                    {formatDate(day.dateStr)}
                  </Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: C.text, fontWeight: "700" }}>
                      {priceFormat(day.total)}
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 13 }}>
                      {day.count} venta{day.count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 60 }}>
          <Ionicons name="bar-chart-outline" size={48} color={C.line2} />
          <Text style={{ color: C.muted, marginTop: 12, fontSize: 16 }}>
            Selecciona un rango para ver el reporte
          </Text>
        </View>
      )}
    </>
  );
}
