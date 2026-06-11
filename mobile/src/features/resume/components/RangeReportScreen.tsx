// mobile/src/features/resume/components/RangeReportScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { PRESETS, useReports } from "../hooks/useReports";

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RangeReportScreen() {
  const {
    activePreset,
    startDate,
    endDate,
    showStartPicker,
    showEndPicker,
    isLoading,
    report,
    applyPreset,
    applyCustom,
    netProfit,
    setShowStartPicker,
    setShowEndPicker,
    setStartDate,
    setEndDate,
  } = useReports();
  
  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 16 }}
        >
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>
            Reportes
          </Text>
          <Text style={{ color: "#737373", fontSize: 14 }}>
            Por rango de fechas
          </Text>
        </View>

        {/* Presets */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            marginBottom: 16,
          }}
        >
          {PRESETS.map((p) => (
            <Pressable
              key={p.label}
              onPress={() => applyPreset(p)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  activePreset === p.label ? "#ff5722" : "#1a1a1a",
                borderWidth: 1,
                borderColor: activePreset === p.label ? "#ff5722" : "#333",
              }}
            >
              <Text
                style={{
                  color: activePreset === p.label ? "#fff" : "#a3a3a3",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Selector de fechas custom */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 16,
            backgroundColor: "#1a1a1a",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#2a2a2a",
          }}
        >
          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Rango personalizado
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            {/* Fecha inicio */}
            <Pressable
              onPress={() => setShowStartPicker(true)}
              style={{
                flex: 1,
                backgroundColor: "#2a2a2a",
                borderRadius: 10,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="#ff5722" />
              <View>
                <Text style={{ color: "#737373", fontSize: 10 }}>Desde</Text>
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}
                >
                  {formatDate(startDate)}
                </Text>
              </View>
            </Pressable>

            {/* Fecha fin */}
            <Pressable
              onPress={() => setShowEndPicker(true)}
              style={{
                flex: 1,
                backgroundColor: "#2a2a2a",
                borderRadius: 10,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="#ff5722" />
              <View>
                <Text style={{ color: "#737373", fontSize: 10 }}>Hasta</Text>
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}
                >
                  {formatDate(endDate)}
                </Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            onPress={applyCustom}
            style={{
              backgroundColor: "#ff5722",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              Generar Reporte
            </Text>
          </Pressable>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={new Date(startDate)}
            mode="date"
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date.toISOString().split("T")[0]);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={new Date(endDate)}
            mode="date"
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date.toISOString().split("T")[0]);
            }}
          />
        )}

        {/* Resultados */}
        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#ff5722" />
            <Text style={{ color: "#737373", marginTop: 12 }}>
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
              <Ionicons name="time-outline" size={14} color="#737373" />
              <Text style={{ color: "#737373", fontSize: 13 }}>
                {formatDate(startDate)} — {formatDate(endDate)}
              </Text>
            </View>

            {/* KPIs principales */}
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 12,
                padding: 16,
                backgroundColor: "#1a1a1a",
                borderRadius: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#ff5722",
              }}
            >
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Total Ventas
              </Text>
              <Text style={{ color: "#fff", fontSize: 36, fontWeight: "900" }}>
                {priceFormat(report.totalSales)}
              </Text>
              <Text style={{ color: "#737373", fontSize: 13, marginTop: 4 }}>
                {report.salesCount} venta{report.salesCount !== 1 ? "s" : ""}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                marginHorizontal: 16,
                gap: 10,
                marginBottom: 12,
              }}
            >
              {/* Cobrado */}
              <View
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: "#22c55e15",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#22c55e33",
                }}
              >
                <Text
                  style={{
                    color: "#22c55e",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  Cobrado
                </Text>
                <Text
                  style={{
                    color: "#22c55e",
                    fontSize: 18,
                    fontWeight: "800",
                    marginTop: 4,
                  }}
                >
                  {priceFormat(report.totalPaid)}
                </Text>
              </View>
              {/* Fiado */}
              <View
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: "#f59e0b15",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#f59e0b33",
                }}
              >
                <Text
                  style={{
                    color: "#f59e0b",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  Fiado
                </Text>
                <Text
                  style={{
                    color: "#f59e0b",
                    fontSize: 18,
                    fontWeight: "800",
                    marginTop: 4,
                  }}
                >
                  {priceFormat(report.totalDebt)}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                marginHorizontal: 16,
                gap: 10,
                marginBottom: 16,
              }}
            >
              {/* Gastos */}
              <View
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: "#ef444415",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#ef444433",
                }}
              >
                <Text
                  style={{
                    color: "#ef4444",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  Gastos
                </Text>
                <Text
                  style={{
                    color: "#ef4444",
                    fontSize: 18,
                    fontWeight: "800",
                    marginTop: 4,
                  }}
                >
                  -{priceFormat(report.expenses.total)}
                </Text>
              </View>
              {/* Ganancia neta */}
              <View
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  backgroundColor: netProfit >= 0 ? "#22c55e15" : "#ef444415",
                  borderColor: netProfit >= 0 ? "#22c55e33" : "#ef444433",
                }}
              >
                <Text
                  style={{
                    color: netProfit >= 0 ? "#22c55e" : "#ef4444",
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  Ganancia
                </Text>
                <Text
                  style={{
                    color: netProfit >= 0 ? "#22c55e" : "#ef4444",
                    fontSize: 18,
                    fontWeight: "800",
                    marginTop: 4,
                  }}
                >
                  {netProfit >= 0 ? "" : "-"}
                  {priceFormat(Math.abs(netProfit))}
                </Text>
              </View>
            </View>

            {/* Top productos */}
            {report.topProducts.length > 0 && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  padding: 16,
                  backgroundColor: "#1a1a1a",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 15,
                    marginBottom: 12,
                  }}
                >
                  Top Productos
                </Text>
                {report.topProducts.map((p: any, i: number) => {
                  const maxQty = report.topProducts[0].quantity;
                  const pct = (p.quantity / maxQty) * 100;
                  return (
                    <View key={p.name} style={{ marginBottom: 10 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: "#ff5722",
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            #{i + 1}
                          </Text>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            {p.name}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 13,
                              fontWeight: "700",
                            }}
                          >
                            {priceFormat(p.total)}
                          </Text>
                          <Text style={{ color: "#737373", fontSize: 11 }}>
                            {p.quantity} uds
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          height: 4,
                          backgroundColor: "#2a2a2a",
                          borderRadius: 2,
                        }}
                      >
                        <View
                          style={{
                            height: 4,
                            backgroundColor: "#ff5722",
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

            {/* Gastos por categoría */}
            {report.expenses.byCategory.length > 0 && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  padding: 16,
                  backgroundColor: "#1a1a1a",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 15,
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
                        <Text style={{ color: "#a3a3a3", fontSize: 13 }}>
                          {cat.category}
                        </Text>
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          -{priceFormat(cat.total)}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 4,
                          backgroundColor: "#2a2a2a",
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
                  backgroundColor: "#1a1a1a",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 15,
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
                      borderBottomColor: "#2a2a2a",
                    }}
                  >
                    <Text style={{ color: "#a3a3a3", fontSize: 13 }}>
                      {formatDate(day.dateStr)}
                    </Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: "#fff", fontWeight: "700" }}>
                        {priceFormat(day.total)}
                      </Text>
                      <Text style={{ color: "#737373", fontSize: 11 }}>
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
            <Ionicons name="bar-chart-outline" size={48} color="#333" />
            <Text style={{ color: "#737373", marginTop: 12, fontSize: 14 }}>
              Selecciona un rango para ver el reporte
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
