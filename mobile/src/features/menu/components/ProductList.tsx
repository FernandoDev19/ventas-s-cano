import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { CategoryType } from "../../categories/types/category.type";
import { ProductType } from "../../products/types/product.type";
import { RecipeType } from "../../recipes/types/recipe.type";
import MenuHeader from "./MenuHeader";
import MenuProductCard from "./MenuProductCard";
import MenuRecipeCard from "../../recipes/components/MenuRecipeCard";

type Props = {
  products: ProductType[];
  categories: Partial<CategoryType>[];
  filter: string;
  setFilter: (filter: string) => void;
  search: string;
  setSearch: (s: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  setIsRefreshing: (i: boolean) => void;
  loadData: (d: boolean) => void;
  recipes?: RecipeType[];
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
  loadData,
  recipes = [],
}: Props) => {
  if (isLoading)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f0f0f" }}>
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );

  const availableRecipes = recipes.filter((r) => r.canPrepare !== false);
  const unavailableRecipes = recipes.filter((r) => !r.canPrepare);
  const allRecipes = [...availableRecipes, ...unavailableRecipes];

  return (
    <FlatList
      data={products}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => { setIsRefreshing(true); loadData(true); }}
          tintColor="#ff5722"
        />
      }
      ListHeaderComponent={
        <>
          <MenuHeader
            categories={categories}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
          />

          {/* Recipes section — only show if there are recipes */}
          {allRecipes.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700" }}>
                  🍽 Platos / Combos
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "#2a2a2a" }} />
                <Text style={{ color: "#ff5722", fontSize: 11, fontWeight: "700" }}>
                  {availableRecipes.length}/{allRecipes.length} disponibles
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
                {allRecipes.map((recipe) => (
                  <View key={recipe.id} style={{ width: "47%" }}>
                    <MenuRecipeCard recipe={recipe} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Products section label */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700" }}>
              Productos
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#2a2a2a" }} />
          </View>
        </>
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
  );
};

export default ProductList;
