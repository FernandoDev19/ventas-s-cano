import { useCallback, useState } from "react";
import { CategoryType } from "../../categories/types/category.type";
import { CategoriesService } from "../../categories/services/categories.service";
import { Alert } from "react-native";
import { useFocusEffect } from "expo-router";

export const useMenu = () => {
  const [filter, setFilter] = useState("");
  const [categories, setCategories] = useState<Partial<CategoryType>[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const loaded: CategoryType[] = await CategoriesService.getAll();
      const mapped = loaded.map((category) => ({ id: category.id, name: category.name }));
      // Agregar botón "Todos" al inicio del menú de categorías
      const allCategories = [{ id: "", name: "Todos" }, ...mapped];
      setCategories(allCategories);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudieron cargar las categorías");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  )

  return {
    filter,
    categories,
    setFilter
  };
};
