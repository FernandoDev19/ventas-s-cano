import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { ProductType } from "../types/product.type";
import { CategoryType } from "../../categories/types/category.type";
import { ProductsService } from "../services/products.service";
import { CategoriesService } from "../../categories/services/categories.service";
import { STOCK_LOW_THRESHOLD } from "../helpers/stock-status.helper";

export const useInventory = () => {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);

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

    useEffect(() => { loadData(); }, [loadData]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadData(true);
    }, [loadData]);

    const handleAdjustStock = useCallback(async (product: ProductType, delta: number) => {
        const newStock = Math.max(0, product.stock + delta);
        setUpdatingId(product.id);
        try {
            await ProductsService.updateProduct(product.id, { stock: newStock });
            setProducts(prev =>
                prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p)
            );
        } catch {
            Alert.alert("Error", "No se pudo actualizar el stock.");
        } finally {
            setUpdatingId(null);
        }
    }, []);

    const openEdit = useCallback((product: ProductType) => {
        setEditingProduct(product);
    }, []);

    const closeEdit = useCallback(() => {
        setEditingProduct(null);
    }, []);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === null || p.category_id === selectedCategory;
        return matchesSearch && matchesCat;
    });

    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock <= STOCK_LOW_THRESHOLD).length;
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

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
        totalValue,
        loadData,
    }
}