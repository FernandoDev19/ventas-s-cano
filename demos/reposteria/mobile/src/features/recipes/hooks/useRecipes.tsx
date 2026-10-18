import { useCallback, useEffect, useState } from "react";
import { RecipeType } from "../types/recipe.type";
import { CategoryType } from "../../categories/types/category.type";
import { ProductType } from "../../inventory/types/product.type";
import { RecipesService } from "../services/recipes.service";
import { ProductsService } from "../../inventory/services/products.service";
import { CategoriesService } from "../../categories/services/categories.service";
import { Alert } from "react-native";

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<RecipeType[]>([]);
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeType | null>(null);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const [r, p, c] = await Promise.all([
        RecipesService.getAll(),
        ProductsService.getProducts(),
        CategoriesService.getAll(),
      ]);
      setRecipes(r);
      setAllProducts(p);
      setCategories(c);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = (recipe: RecipeType) => {
    Alert.alert(
      "Eliminar Receta",
      `¿Seguro que deseas eliminar la receta "${recipe.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await RecipesService.delete(recipe.id!);
              loadData();
            } catch {
              Alert.alert("Error", "No se pudo eliminar la receta.");
            }
          },
        },
      ],
    );
  };

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return {
    recipes,
    allProducts,
    categories,
    isLoading,
    isRefreshing,
    search,
    showCreate,
    editingRecipe,
    loadData,
    handleDelete,
    filtered,
    setSearch,
    setShowCreate,
    setEditingRecipe,
  };
};
