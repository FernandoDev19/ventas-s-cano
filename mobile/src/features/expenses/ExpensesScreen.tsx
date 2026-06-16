import Button from "@/src/shared/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import ExpenseDetailModal from "./components/ExpenseDetailModal";
import CreateExpenseModal from "./components/CreateExpenseModal";
import { useExpenses } from "./hooks/useExpenses";
import ExpensesHeader from "./components/ExpensesHeader";
import ExpenseItem from "./components/ExpenseItem";

export default function ExpensesScreen() {
  const {
    isLoading,
    expenses,
    categories,
    totalMonth,
    byCategory,
    selectedCategory,
    setSelectedCategory,
    isRefreshing,
    onRefresh,
    showCreate,
    setShowCreate,
    selectedExpense,
    setSelectedExpense,
    loadData,
    handleDelete,
    filteredExpenses,
  } = useExpenses();

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#0f0f0f" }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
        <Text className="text-neutral-500 mt-3 text-sm">
          Cargando gastos...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#ff5722"
          />
        }
        ListHeaderComponent={
          <ExpensesHeader
            categories={categories}
            expenses={expenses}
            totalMonth={totalMonth}
            byCategory={byCategory}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        }
        renderItem={({ item }) => {
          const cat = categories.find((c) => c.id === item.category_id);
          return (
            <ExpenseItem
              item={item}
              cat={cat}
              setSelectedExpense={setSelectedExpense}
              handleDelete={handleDelete}
            />
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <Ionicons name="wallet-outline" size={36} color="#444" />
            </View>
            <Text className="text-white font-bold text-lg text-center mb-1">
              Sin gastos
            </Text>
            <Text className="text-neutral-500 text-sm text-center">
              No hay gastos registrados
              {selectedCategory !== null ? " en esta categoría" : ""}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <Button onPress={() => setShowCreate(true)} circle>
        <Ionicons name="add" size={28} color="#fff" />
      </Button>

      <CreateExpenseModal
        visible={showCreate}
        categories={categories}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          loadData(true);
        }}
      />

      <ExpenseDetailModal
        visible={selectedExpense !== null}
        expense={selectedExpense}
        category={
          categories.find((c) => c.id === selectedExpense?.category_id) ?? null
        }
        onClose={() => setSelectedExpense(null)}
        onDeleted={() => loadData(true)}
      />
    </View>
  );
}
