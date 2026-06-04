import { CategoryType } from "@/src/features/categories/types/category.type";
import Button from "@/src/shared/components/ui/Button";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { getStockStatus, STOCK_CRITICAL_THRESHOLD, STOCK_LOW_THRESHOLD } from "../helpers/stock-status.helper";
import { useInventory } from "../hooks/useInventory";
import CreateProductModal from "./CreateProductModal";
import EditProductModal from "./EditProductModal";

// ───────────────────────── Pantalla principal ─────────────────────────
export default function InventoryScreen() {
  const {
    isLoading,
    filteredProducts,
    isRefreshing,
    onRefresh,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    selectedCategory,
    categories,
    totalProducts,
    lowStock,
    totalValue,
    updatingId,
    handleAdjustStock,
    setShowCreate,
    showCreate,
    editingProduct,
    openEdit,
    closeEdit,
    loadData
  } = useInventory();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: "#0f0f0f" }}>
        <ActivityIndicator size="large" color="#ff5722" />
        <Text className="text-neutral-500 mt-3 text-sm">Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#ff5722"
          />
        }
        ListHeaderComponent={
          <View className="pt-4">
            {/* Title */}
            <View className="px-4 mb-4">
              <Text className="text-2xl font-extrabold text-white">
                Inventario
              </Text>
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
                  backgroundColor:
                    selectedCategory === null ? "#ff5722" : "#1a1a1a",
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
                    onPress={() =>
                      setSelectedCategory(isActive ? null : cat.id)
                    }
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
                    <Ionicons
                      name="warning-outline"
                      size={10}
                      color="#f59e0b"
                    />
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
              <View
                className="h-px flex-1"
                style={{ backgroundColor: "#2a2a2a" }}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStockStatus(item.stock);
          const isUpdating = updatingId === item.id;
          return (
            <View
              className="mx-4 mb-3 p-4 rounded-2xl"
              style={{
                backgroundColor: "#1a1a1a",
                borderWidth: 1,
                borderColor:
                  item.stock <= STOCK_CRITICAL_THRESHOLD
                    ? "#ef444433"
                    : "#2a2a2a",
              }}
            >
              {/* Top row */}
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row flex-1 mr-3 items-center">
                  <Image
                    source={
                      item.image_url
                        ? { uri: item.image_url }
                        : require("@/assets/images/default-food.png")
                    }
                    style={{ width: 50, height: 50, borderRadius: 10, marginRight: 12 }}
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text
                      className="text-white font-bold text-base"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-neutral-500 text-xs mt-0.5">
                      {priceFormat(item.price)} / unidad
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text
                    className="text-3xl font-extrabold"
                    style={{
                      color:
                        item.stock <= STOCK_CRITICAL_THRESHOLD
                          ? "#ef4444"
                          : item.stock <= STOCK_LOW_THRESHOLD
                            ? "#f59e0b"
                            : "#fff",
                    }}
                  >
                    {item.stock}
                  </Text>
                  <Text className="text-neutral-600 text-[10px] uppercase">
                    unidades
                  </Text>
                </View>
              </View>

              {/* Status badge */}
              <View
                className="self-start px-2 py-0.5 rounded-full mb-3"
                style={{ backgroundColor: status.bg }}
              >
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: status.color }}
                >
                  {status.label}
                </Text>
              </View>

              {/* Actions row */}
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => openEdit(item)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "#2a2a2a" }}
                >
                  <Ionicons name="pencil-outline" size={14} color="#a3a3a3" />
                  <Text className="text-neutral-400 text-xs font-medium">
                    Editar
                  </Text>
                </Pressable>

                {/* Stock stepper */}
                <View
                  className="flex-row items-center gap-0 rounded-xl overflow-hidden"
                  style={{ backgroundColor: "#2a2a2a" }}
                >
                  <Pressable
                    onPress={() => handleAdjustStock(item, -1)}
                    disabled={isUpdating || item.stock === 0}
                    className="px-3 py-2.5 items-center justify-center"
                    style={{ opacity: item.stock === 0 ? 0.3 : 1 }}
                  >
                    <Ionicons name="remove" size={16} color="#a3a3a3" />
                  </Pressable>
                  <View className="px-3 py-2">
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#ff5722" />
                    ) : (
                      <Text className="text-white text-xs font-bold">
                        Stock
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleAdjustStock(item, 1)}
                    disabled={isUpdating}
                    className="px-3 py-2.5 items-center justify-center"
                  >
                    <Ionicons name="add" size={16} color="#ff5722" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <Ionicons name="cube-outline" size={36} color="#444" />
            </View>
            <Text className="text-white font-bold text-lg text-center mb-1">
              Sin productos
            </Text>
            <Text className="text-neutral-500 text-sm text-center">
              {searchQuery
                ? `No se encontraron resultados para "${searchQuery}"`
                : "No hay productos en el inventario"}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Button onPress={() => setShowCreate(true)} circle>
        <Ionicons name="add" size={28} color="#fff" />
      </Button>

      <CreateProductModal
        visible={showCreate}
        categories={categories}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          loadData(true);
        }}
      />

      <EditProductModal
        visible={editingProduct !== null}
        product={editingProduct}
        categories={categories}
        onClose={closeEdit}
        onUpdated={() => {
          closeEdit();
          loadData(true);
        }}
      />
    </View>
  );
}
