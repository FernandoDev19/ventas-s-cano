import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CategoryType } from "../../categories/types/category.type";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";

type Props = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  categories: CategoryType[];
  totalProducts: number;
  lowStock: number;
  totalValue: number;
};

export default function ProductsInventoryHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  totalProducts,
  lowStock,
  totalValue,
}: Props) {
  return (
    <View className="pt-4">
      {/* Title */}
      <View className="px-4 mb-4">
        <Text className="text-2xl font-extrabold text-white">Inventario</Text>
        <Text className="text-neutral-500 text-sm">
          Gestión de productos y stock
        </Text>
      </View>

      {/* Search bar */}
      <View
        className="mx-4 mb-4 flex-row items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: "#1a1a1a",
          borderWidth: 1,
          borderColor: "#2a2a2a",
        }}
      >
        <Ionicons name="search-outline" size={18} color="#737373" />
        <TextInput
          placeholder="Buscar producto..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 text-white text-sm"
          style={{ color: "#fff" }}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#555" />
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
            backgroundColor: selectedCategory === null ? "#ff5722" : "#1a1a1a",
            borderWidth: 1,
            borderColor: selectedCategory === null ? "#ff5722" : "#333",
          }}
        >
          <Text
            className="text-sm font-semibold"
            style={{
              color: selectedCategory === null ? "#fff" : "#a3a3a3",
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
                backgroundColor: isActive ? "#ff5722" : "#1a1a1a",
                borderWidth: 1,
                borderColor: isActive ? "#ff5722" : "#333",
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: isActive ? "#fff" : "#a3a3a3" }}
              >
                {cat.name.split(" ")[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* KPI row */}
      <View className="flex-row mx-4 gap-3 mb-4">
        <View
          className="flex-1 p-3 rounded-xl"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <Text className="text-neutral-500 text-[10px] uppercase tracking-wider">
            Total Productos
          </Text>
          <Text className="text-white text-xl font-extrabold mt-1">
            {totalProducts}
          </Text>
        </View>
        <View
          className="flex-1 p-3 rounded-xl"
          style={{
            backgroundColor: lowStock > 0 ? "#f59e0b15" : "#1a1a1a",
            borderWidth: 1,
            borderColor: lowStock > 0 ? "#f59e0b44" : "transparent",
          }}
        >
          <View className="flex-row items-center gap-1">
            <Text
              className="text-[10px] uppercase tracking-wider"
              style={{ color: lowStock > 0 ? "#f59e0b" : "#737373" }}
            >
              Stock Bajo
            </Text>
            {lowStock > 0 && (
              <Ionicons name="warning-outline" size={10} color="#f59e0b" />
            )}
          </View>
          <Text
            className="text-xl font-extrabold mt-1"
            style={{ color: lowStock > 0 ? "#f59e0b" : "#fff" }}
          >
            {String(lowStock).padStart(2, "0")}
          </Text>
        </View>
        <View
          className="flex-1 p-3 rounded-xl"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <Text className="text-neutral-500 text-[10px] uppercase tracking-wider">
            Valor Total
          </Text>
          <Text className="text-white text-xl font-extrabold mt-1">
            {totalValue >= 1_000_000
              ? `$${(totalValue / 1_000_000).toFixed(1)}M`
              : priceFormat(totalValue)}
          </Text>
        </View>
      </View>

      {/* Section label */}
      <View className="px-4 mb-3 flex-row items-center gap-2">
        <Text className="text-neutral-400 text-xs uppercase tracking-widest">
          Existencias Actuales
        </Text>
        <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
      </View>
    </View>
  );
}
