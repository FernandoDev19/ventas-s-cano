import { useCallback, useEffect, useState } from "react";
import { ExpenseType } from "../types/expense.type";
import { CategoryType } from "../../categories/types/category.type";
import ExpensesService from "../services/expense.service";
import { CategoriesService } from "../../categories/services/categories.service";
import { Alert } from "react-native";

export const useExpenses = () => {
      const [expenses, setExpenses] = useState<ExpenseType[]>([]);
      const [categories, setCategories] = useState<CategoryType[]>([]);
      const [totalMonth, setTotalMonth] = useState(0);
      const [byCategory, setByCategory] = useState<
        { category: string; total: number }[]
      >([]);
      const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [isRefreshing, setIsRefreshing] = useState(false);
      const [showCreate, setShowCreate] = useState(false);
      const [selectedExpense, setSelectedExpense] = useState<ExpenseType | null>(
        null,
      );
    
      const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
          const [expensesData, catsData, total, byCat] = await Promise.all([
            ExpensesService.getAllExpenses(),
            CategoriesService.getAll(),
            ExpensesService.getTotalExpenses(),
            ExpensesService.getTotalByCategory(),
          ]);
          setExpenses(expensesData);
          setCategories(catsData);
          setTotalMonth(total);
          setByCategory(byCat);
        } catch (err) {
          console.error("Error loading expenses:", err);
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }, []);
    
      useEffect(() => {
        loadData();
      }, [loadData]);
    
      const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadData(true);
      }, [loadData]);
    
      const handleDelete = useCallback((expense: ExpenseType) => {
        Alert.alert(
          "Eliminar gasto",
          `¿Seguro que quieres eliminar "${expense.description}"?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: async () => {
                try {
                  await ExpensesService.deleteExpense(expense.id);
                  setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
                  setTotalMonth((prev) => prev - expense.amount);
                } catch {
                  Alert.alert("Error", "No se pudo eliminar el gasto.");
                }
              },
            },
          ],
        );
      }, []);
    
      const filteredExpenses =
        selectedCategory === null
          ? expenses
          : expenses.filter((e) => e.category_id === selectedCategory);
    
      return {
        expenses,
        categories,
        totalMonth,
        byCategory,
        selectedCategory,
        setSelectedCategory,
        isLoading,
        isRefreshing,
        onRefresh,
        showCreate,
        setShowCreate,
        selectedExpense,
        setSelectedExpense,
        loadData,
        handleDelete,
        filteredExpenses,
      };
};