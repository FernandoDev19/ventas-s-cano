// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CategoryType } from "../../categories/types/category.type";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { C } from "@/src/core/theme/palette";
import ExportButton from "@/src/shared/components/ui/ExportButton";
import { ExportDataService } from "@/src/shared/services/expor-data.service";

type Props = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  categories: CategoryType[];
  totalProducts: number;
  lowStock: number;
  stockCostValue: number;
  stockSaleValue: number;
  potentialProfit: number;
  avgMargin: number;
  uncostedCount: number;
};

export default function ProductsInventoryHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  totalProducts,
  lowStock,
  stockCostValue,
  stockSaleValue,
  potentialProfit,
  avgMargin,
  uncostedCount,
}: Props) {
  const money = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : priceFormat(n);
  const scopeName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name
    : "Todos";

  return (
    <View className="pt-4">
      {/* Title */}
      <View className="px-4 mb-4 flex-row justify-between items-center">
        <View>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: "800" }}>
            Inventario
          </Text>
          <Text style={{ color: C.muted, fontSize: 16 }}>
            Gestión de productos y stock
          </Text>
        </View>
        <ExportButton onExport={ExportDataService.inventory} />
      </View>

      {/* Search bar */}
      <View
        className="mx-4 mb-4 flex-row items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.line,
        }}
      >
        <Ionicons name="search-outline" size={18} color={C.muted} />
        <TextInput
          placeholder="Buscar producto..."
          placeholderTextColor={C.faint}
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 text-neutral-900 dark:text-white text-base"
          style={{ color: C.text }}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={C.faint} />
          </Pressable>
        )}
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        className="mb-4"
      >
        <Pressable
          onPress={() => setSelectedCategory(null)}
          className="px-4 py-2 rounded-full"
          style={{
            backgroundColor: selectedCategory === null ? "#ff5722" : C.card,
            borderWidth: 1,
            borderColor: selectedCategory === null ? "#ff5722" : C.line2,
          }}
        >
          <Text
            className="text-base font-semibold"
            style={{
              color: selectedCategory === null ? "#fff" : C.soft,
            }}
          >
            Todos
          </Text>
        </Pressable>
        {categories.map((cat: CategoryType) => {
          const isActive = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(isActive ? null : cat.id)}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: isActive ? "#ff5722" : C.card,
                borderWidth: 1,
                borderColor: isActive ? "#ff5722" : C.line2,
              }}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: isActive ? "#fff" : C.soft }}
              >
                {cat.name.split(" ")[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Primera fila de KPIs */}
      <View className="flex-row mx-4 gap-3 mb-4">
        <View
          className="flex-1 p-3 rounded-xl"
          style={{ backgroundColor: C.card }}
        >
          <Text className="text-neutral-500 text-[12px] uppercase tracking-wider">
            Total Productos
          </Text>
          <Text className="text-neutral-900 dark:text-white text-2xl font-extrabold mt-1">
            {totalProducts}
          </Text>
        </View>
        <View
          className="flex-1 p-3 rounded-xl"
          style={{
            backgroundColor: lowStock > 0 ? "#f59e0b15" : C.card,
            borderWidth: 1,
            borderColor: lowStock > 0 ? "#f59e0b44" : "transparent",
          }}
        >
          <View className="flex-row items-center gap-1">
            <Text
              className="text-[12px] uppercase tracking-wider"
              style={{ color: lowStock > 0 ? "#f59e0b" : C.muted }}
            >
              Stock Bajo
            </Text>
            {lowStock > 0 && (
              <Ionicons name="warning-outline" size={10} color="#f59e0b" />
            )}
          </View>
          <Text
            className="text-2xl font-extrabold mt-1"
            style={{ color: lowStock > 0 ? "#f59e0b" : "#fff" }}
          >
            {String(lowStock).padStart(2, "0")}
          </Text>
        </View>
      </View>

      {/* Etiqueta de alcance */}
      <Text
        style={{
          color: C.muted,
          fontSize: 13,
          paddingHorizontal: 16,
          marginBottom: 6,
        }}
      >
        Resumen de: {scopeName}
      </Text>

      {/* Segunda fila de KPIs */}
      <View className="flex-row mx-4 gap-3 mb-4">
        <View
          className="flex-1 p-3 rounded-xl"
          style={{ backgroundColor: C.card }}
        >
          <Text className="text-neutral-500 text-[12px] uppercase tracking-wider">
            Invertido (costo)
          </Text>
          <Text
            style={{
              color: C.text,
              fontSize: 18,
              fontWeight: "800",
              marginTop: 4,
            }}
          >
            {money(stockCostValue)}
          </Text>
        </View>
        <View
          className="flex-1 p-3 rounded-xl"
          style={{ backgroundColor: C.card }}
        >
          <Text className="text-neutral-500 text-[12px] uppercase tracking-wider">
            Venta potencial
          </Text>
          <Text
            style={{
              color: C.text,
              fontSize: 18,
              fontWeight: "800",
              marginTop: 4,
            }}
          >
            {money(stockSaleValue)}
          </Text>
        </View>
        <View
          className="flex-1 p-3 rounded-xl"
          style={{
            backgroundColor: "#22c55e15",
            borderWidth: 1,
            borderColor: "#22c55e44",
          }}
        >
          <Text
            style={{ color: "#22c55e", fontSize: 12, textTransform: "uppercase" }}
          >
            Ganancia · {avgMargin.toFixed(0)}%
          </Text>
          <Text
            style={{
              color: "#22c55e",
              fontSize: 18,
              fontWeight: "800",
              marginTop: 4,
            }}
          >
            {money(potentialProfit)}
          </Text>
        </View>
      </View>

      {uncostedCount > 0 && (
        <Text
          style={{
            color: C.warnText,
            fontSize: 13,
            paddingHorizontal: 16,
            marginBottom: 8,
          }}
        >
          {uncostedCount} producto{uncostedCount !== 1 ? "s" : ""} sin costo: el
          margen real es distinto.
        </Text>
      )}

      {/* Section label */}
      <View className="px-4 mb-3 flex-row items-center gap-2">
        <Text className="text-neutral-600 dark:text-neutral-400 text-sm uppercase tracking-widest">
          Existencias Actuales
        </Text>
        <View className="h-px flex-1" style={{ backgroundColor: C.line }} />
      </View>
    </View>
  );
}