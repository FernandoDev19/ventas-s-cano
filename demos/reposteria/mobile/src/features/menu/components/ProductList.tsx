import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { CategoryType } from "../../categories/types/category.type";
import MenuHeader from "./MenuHeader";
import MenuProductCard from "./MenuProductCard";
import { useProductList } from "../hooks/useProductList";
import CartModal from "./cart/CartModal";

type Props = {
  categories: Partial<CategoryType>[];
  filter: string;
  setFilter: (filter: string) => void;
};

const ProductList = ({ categories, filter, setFilter }: Props) => {
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

  if (isLoading)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f0f",
        }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );

  const availableRecipes = recipes.filter((r) => r.canPrepare !== false);
  const unavailableRecipes = recipes.filter((r) => !r.canPrepare);
  const allRecipes = [...availableRecipes, ...unavailableRecipes];

  return (
    <>
      <View className="px-6">
        <FlatList
          data={products}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadProducts(true);
              }}
              tintColor="#ff5722"
            />
          }
          ListHeaderComponent={
            <MenuHeader
              categories={categories}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              availableRecipes={availableRecipes}
              allRecipes={allRecipes}
            />
          }
          renderItem={({ item }) => <MenuProductCard product={item} />}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, width: "100%", paddingBottom: 100 }}
          columnWrapperStyle={{ gap: 16 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Text className="text-white text-center w-full text-2xl">
                No hay productos
              </Text>
            </View>
          }
        />
      </View>

      <CartModal onSaleCreated={loadProducts} />
    </>
  );
};

export default ProductList;
