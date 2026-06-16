import { Text, View } from "react-native";
import SalesSummaryBar, { FilterId } from "./SalesSummaryBar";
import { Ionicons } from "@expo/vector-icons";
import { SaleType } from "../types/sale.type";

type Props = {
  sales: SaleType[];
  filter: FilterId;
  setFilter: (filter: FilterId) => void;
};

export default function SalesHeader({ sales, filter, setFilter }: Props) {
  return (
    <View className="pt-4">
      {/* Title */}
      <View className="px-4 mb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-extrabold text-white">Ventas</Text>
          <Text className="text-neutral-500 text-sm">
            {sales.length} venta{sales.length !== 1 ? "s" : ""} registrada
            {sales.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="analytics-outline" size={20} color="#ff5722" />
        </View>
      </View>

      <SalesSummaryBar filter={filter} setFilter={setFilter} sales={sales} />

      {/* Section label */}
      <View className="px-4 mb-2 flex-row items-center gap-2">
        <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
        <Text className="text-neutral-600 text-xs uppercase tracking-widest px-2">
          {filter === "all"
            ? "Todas las ventas"
            : filter === "paid"
              ? "Ventas pagadas"
              : "Ventas fiadas"}
        </Text>
        <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
      </View>
    </View>
  );
}
