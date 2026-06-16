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
      const categories: CategoryType[] = await CategoriesService.getAll();
      const mapped = categories.map((category) => ({ id: category.id, name: category.name }));
      setCategories(mapped);
      // Inicializar filtro con la primera categoría si no hay ninguna seleccionada
      if (mapped.length > 0 && mapped[0].id !== undefined) {
        setFilter(mapped[0].id);
      }
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
