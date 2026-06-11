import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { ProductsService } from "../../products/services/products.service";
import { ProductType } from "../../products/types/product.type";
import { RecipesService } from "../../recipes/services/recipes.service";
import { RecipeType } from "../../recipes/types/recipe.type";

export const useProductList = (filter: number) => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [recipes, setRecipes] = useState<RecipeType[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  
  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) && (filter === 0 || r.category_id === filter)
  );

  const loadProducts = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const [loadedProducts, loadedRecipes] = await Promise.all([
          ProductsService.getAll({ category_id: filter.toString() }),
          RecipesService.getAll()
        ]);
        setProducts(loadedProducts);
        setRecipes(loadedRecipes);
      } catch (error) {
        Alert.alert("Error", "Failed to load products and recipes");
        console.log(error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filter],
  );

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  return {
    products: filteredProducts,
    recipes: filteredRecipes,
    loadProducts,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    setIsRefreshing
  };
};

