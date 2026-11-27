// @theme-migrated
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
import { C } from "@/src/core/theme/palette";

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
    stockCostValue,
    stockSaleValue,
    potentialProfit,
    avgMargin,
    uncostedCount,
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
        style={{ backgroundColor: C.bg }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
        <Text className="text-neutral-500 mt-3 text-base">
          Cargando inventario...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f2f2f4] dark:bg-background">
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
            stockCostValue={stockCostValue}
            stockSaleValue={stockSaleValue}
            potentialProfit={potentialProfit}
            avgMargin={avgMargin}
            uncostedCount={uncostedCount}
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
              style={{ backgroundColor: C.card }}
            >
              <Ionicons name="cube-outline" size={36} color="#444" />
            </View>
            <Text className="text-neutral-900 dark:text-white font-bold text-xl text-center mb-1">
              Sin productos
            </Text>
            <Text className="text-neutral-500 text-base text-center">
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
        <Ionicons name="add" size={28} color={C.text} />
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
