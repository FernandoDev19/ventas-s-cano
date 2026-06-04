import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { CategoryType } from "../../categories/types/category.type";
import { ProductType } from "../../products/types/product.type";
import MenuHeader from "./MenuHeader";
import MenuProductCard from "./MenuProductCard";

type Props = {
  products: ProductType[];
  categories: Partial<CategoryType>[];
  filter: number;
  setFilter: (filter: number) => void;
  search: string;
  setSearch: (s: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  setIsRefreshing: (i: boolean) => void
  loadData: (d: boolean) => void
};

const ProductList = ({
  products,
  categories,
  filter,
  setFilter,
  search,
  setSearch,
  isLoading,
  isRefreshing,
  setIsRefreshing,
  loadData
}: Props) => {
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

  return (
    <FlatList
      data={products}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadData(true); }} tintColor="#ff5722" />}
      ListHeaderComponent={
        <MenuHeader
          categories={categories}
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
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
            No products found
          </Text>
        </View>
      }
    />
  );
};

export default ProductList;
