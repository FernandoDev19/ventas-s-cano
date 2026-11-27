import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { ProductType } from "../types/product.type";
import { CategoryType } from "../../categories/types/category.type";
import { ProductsService } from "../services/products.service";
import { CategoriesService } from "../../categories/services/categories.service";
import { STOCK_LOW_THRESHOLD } from "../helpers/stock-status.helper";
import { useOnDataChanged } from "@/src/shared/hooks/useRealtimeSync";

export const useInventory = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(
    null,
  );

  useOnDataChanged(["products", "categories"], () => {
    loadData(true);
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        ProductsService.getProducts(),
        CategoriesService.getAll(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handleAdjustStock = useCallback(
    async (product: ProductType, delta: number) => {
      const newStock = Math.max(0, product.stock + delta);
      setUpdatingId(product.id);
      try {
        await ProductsService.updateProduct(product.id, { stock: newStock });
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, stock: newStock } : p,
          ),
        );
      } catch {
        Alert.alert("Error", "No se pudo actualizar el stock.");
      } finally {
        setUpdatingId(null);
      }
    },
    [],
  );

  const openEdit = useCallback((product: ProductType) => {
    setEditingProduct(product);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingProduct(null);
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const scoped =
    selectedCategory === null
      ? products
      : products.filter((p) => p.category_id === selectedCategory);
  const sellable = scoped.filter((p) => !p.is_supply);
  const costed = sellable.filter((p) => (p.cost ?? 0) > 0 && p.price > 0);

  const totalProducts = scoped.length;
  const lowStock = scoped.filter((p) => p.stock <= STOCK_LOW_THRESHOLD).length;
  const stockCostValue = scoped.reduce((s, p) => s + (p.cost ?? 0) * p.stock, 0); // dinero invertido
  const stockSaleValue = sellable.reduce((s, p) => s + p.price * p.stock, 0);
  const potentialProfit = costed.reduce((s, p) => s + (p.price - p.cost!) * p.stock, 0);
  const avgMargin = costed.length
    ? (costed.reduce((s, p) => s + (p.price - p.cost!), 0) /
      costed.reduce((s, p) => s + p.price, 0)) * 100
    : 0;
  const uncostedCount = sellable.filter((p) => !(p.cost ?? 0)).length;

  return {
    isLoading,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isRefreshing,
    updatingId,
    showCreate,
    setShowCreate,
    editingProduct,
    openEdit,
    closeEdit,
    onRefresh,
    handleAdjustStock,
    filteredProducts,
    totalProducts,
    lowStock,
    stockCostValue,
    stockSaleValue,
    potentialProfit,
    avgMargin,
    uncostedCount,
    loadData,
  };
};
