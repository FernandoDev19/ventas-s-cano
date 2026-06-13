import CartModal from "@/src/features/menu/components/CartModal";
import ProductList from "@/src/features/menu/components/ProductList";
import ShareMenuQRModal from "@/src/features/menu/components/ShareMenuQRModal";
import { useMenu } from "@/src/features/menu/hooks/useMenu";
import { useProductList } from "@/src/features/menu/hooks/useProductList";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

export default function MenuTab() {
  const { filter, categories, setFilter, showQRModal, setShowQRModal } = useMenu();
  const {
    products,
    recipes,
    loadProducts,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    setIsRefreshing,
  } = useProductList(filter);

  return (
    <View className="flex-1 bg-background">
      <View
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 50,
        }}
      >
        <Pressable
          onPress={() => setShowQRModal(true)}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#ff5722",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#ff5722",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Ionicons name="qr-code" size={24} color="#fff" />
        </Pressable>
      </View>

      <View className="px-6">
        <ProductList
          products={products}
          recipes={recipes}
          categories={categories}
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          loadData={loadProducts}
          setIsRefreshing={setIsRefreshing}
        />
      </View>

      <CartModal onSaleCreated={loadProducts} />

      <ShareMenuQRModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </View>
  );
}
