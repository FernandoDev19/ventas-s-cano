import { Pressable, Text, View } from "react-native";
import SalesSummaryBar, { FilterId } from "./SalesSummaryBar";
import { Ionicons } from "@expo/vector-icons";
import { SaleType } from "../types/sale.type";
import { SalesScope } from "../hooks/useSales";

type Props = {
  sales: SaleType[]; // las del alcance actual
  allSales: SaleType[]; // todas (para fiados pendientes)
  filter: FilterId;
  setFilter: (filter: FilterId) => void;
  scope: SalesScope;
  setScope: (scope: SalesScope) => void;
};

const SCOPES: { id: SalesScope; label: string }[] = [
  { id: "shift", label: "Turno actual" },
  { id: "history", label: "Historial" },
];

export default function SalesHeader({
  sales,
  allSales,
  filter,
  setFilter,
  scope,
  setScope,
}: Props) {
  return (
    <View className="pt-4">
      {/* Title */}
      <View className="px-4 mb-3 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-extrabold text-white">Ventas</Text>
          <Text className="text-neutral-500 text-sm">
            {sales.length} venta{sales.length !== 1 ? "s" : ""}{" "}
            {scope === "shift" ? "en este turno" : "en el historial"}
          </Text>
        </View>
        <Ionicons name="analytics-outline" size={20} color="#ff5722" />
      </View>

      {/* Selector Turno / Historial */}
      <View className="flex-row gap-2 px-4 mb-4">
        {SCOPES.map((s) => {
          const active = scope === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setScope(s.id)}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: active ? "#ff5722" : "#1a1a1a",
                borderWidth: 1,
                borderColor: active ? "#ff5722" : "#333",
              }}
            >
              <Text
                style={{
                  color: active ? "#fff" : "#a3a3a3",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SalesSummaryBar
        filter={filter}
        setFilter={setFilter}
        sales={sales}
        allSales={allSales}
        totalLabel={scope === "shift" ? "Total turno" : "Total historial"}
      />

      {/* Section label */}
      <View className="px-4 mb-2 flex-row items-center gap-2">
        <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
        <Text className="text-neutral-600 text-xs uppercase tracking-widest px-2">
          {filter === "all"
            ? "Todas las ventas"
            : filter === "paid"
              ? "Ventas pagadas"
              : "Fiados pendientes (todos)"}
        </Text>
        <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
      </View>
    </View>
  );
}