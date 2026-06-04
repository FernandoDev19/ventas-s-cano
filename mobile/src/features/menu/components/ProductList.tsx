import { FlatList, Text, View } from "react-native";
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
};

const ProductList = ({
  products,
  categories,
  filter,
  setFilter,
  search,
  setSearch,
}: Props) => {
  return (
    <FlatList
      data={products}
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
