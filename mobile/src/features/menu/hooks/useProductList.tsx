import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { ProductsService } from "../../products/services/products.service";
import { ProductType } from "../../products/types/product.type";

export const useProductList = (filter: number) => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const loadProducts = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const products = await ProductsService.getAll({
          category_id: filter.toString(),
        });
        setProducts(products);
      } catch (error) {
        Alert.alert("Error", "Failed to load products");
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
    loadProducts,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    setIsRefreshing
  };
};
