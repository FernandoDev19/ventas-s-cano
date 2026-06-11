import CartModal from "@/src/features/menu/components/CartModal";
import ProductList from "@/src/features/menu/components/ProductList";
import { useMenu } from "@/src/features/menu/hooks/useMenu";
import { useProductList } from "@/src/features/menu/hooks/useProductList";
import { View } from "react-native";

export default function MenuTab() {
  const { filter, categories, setFilter } = useMenu();
  const { products, recipes, loadProducts, search, setSearch, isLoading, isRefreshing, setIsRefreshing } = useProductList(filter);

  // TODO: Luego de la venta debe recargar correctamente los productos, cambiar context por zustand para estado global

  return (
    <View className="flex-1 bg-background">
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
    </View>
  );
}

