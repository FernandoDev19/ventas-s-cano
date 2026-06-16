import Button from "@/src/shared/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { getStockStatus } from "../helpers/stock-status.helper";
import { useInventory } from "../hooks/useInventory";
import CreateProductModal from "./CreateProductModal";
import EditProductModal from "./EditProductModal";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import ProductsInventoryHeader from "./ProductsInventoryHeader";
import InventoryItemCard from "./InventoryItemCard";

type Props = {
  activeTab: "productos" | "recetas";
  onChangeTab: (tab: "productos" | "recetas") => void;
};

export default function InventoryScreen({ activeTab, onChangeTab }: Props) {
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
    loadData,
  } = useInventory();

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#0f0f0f" }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
        <Text className="text-neutral-500 mt-3 text-sm">
          Cargando inventario...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <HeaderTabs
        tabs={["productos", "recetas"]}
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />

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
          <ProductsInventoryHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            totalProducts={totalProducts}
            lowStock={lowStock}
            totalValue={totalValue}
          />
        }
        renderItem={({ item }) => {
          const status = getStockStatus(item.stock);
          const isUpdating = updatingId === item.id;
          return (
            <InventoryItemCard
              item={item}
              status={status}
              isUpdating={isUpdating}
              handleAdjustStock={handleAdjustStock}
              openEdit={openEdit}
            />
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
