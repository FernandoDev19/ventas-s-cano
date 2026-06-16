import { Ionicons } from "@expo/vector-icons";
import { getIcon } from "../helpers/getIcon";
import { Pressable, ScrollView, Text, View } from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { CategoryType } from "../../categories/types/category.type";
import { ExpenseType } from "../types/expense.type";

type Props = {
  categories: CategoryType[];
  expenses: ExpenseType[];
  totalMonth: number;
  byCategory: { category: string; total: number }[];
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
};

export default function ExpensesHeader({
  categories,
  expenses,
  totalMonth,
  byCategory,
  selectedCategory,
  setSelectedCategory,
}: Props) {
  return (
    <View className="pt-4">
      {/* Header */}
      <View className="px-4 mb-4">
        <Text className="text-2xl font-extrabold text-white">Gastos</Text>
        <Text className="text-neutral-500 text-sm">
          {expenses.length} registro{expenses.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Total card */}
      <View
        className="mx-4 mb-4 p-5 rounded-2xl"
        style={{
          backgroundColor: "#1a1a1a",
          borderLeftWidth: 4,
          borderLeftColor: "#ff5722",
        }}
      >
        <Text className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
          Total Gastos
        </Text>
        <View className="flex-row items-end gap-3">
          <Text className="text-4xl font-extrabold text-white">
            {priceFormat(totalMonth)}
          </Text>
        </View>

        {/* By category mini breakdown */}
        {byCategory.length > 0 && (
          <View
            className="mt-3 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: "#2a2a2a" }}
          >
            {byCategory.slice(0, 3).map((item) => (
              <View
                key={item.category}
                className="flex-row justify-between mb-1"
              >
                <Text className="text-neutral-500 text-xs">
                  {item.category}
                </Text>
                <Text className="text-neutral-300 text-xs font-semibold">
                  -{priceFormat(item.total)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Category filter */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Pressable
            onPress={() => setSelectedCategory(null)}
            className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
            style={{
              backgroundColor:
                selectedCategory === null ? "#ff5722" : "#1a1a1a",
              borderWidth: 1,
              borderColor: selectedCategory === null ? "#ff5722" : "#333",
            }}
          >
            <Ionicons
              name="grid-outline"
              size={13}
              color={selectedCategory === null ? "#fff" : "#a3a3a3"}
            />
            <Text
              className="text-sm font-semibold"
              style={{
                color: selectedCategory === null ? "#fff" : "#a3a3a3",
              }}
            >
              Todos
            </Text>
          </Pressable>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(isActive ? null : cat.id)}
                className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: isActive ? "#ff5722" : "#1a1a1a",
                  borderWidth: 1,
                  borderColor: isActive ? "#ff5722" : "#333",
                }}
              >
                <Ionicons
                  name={getIcon(cat.name)}
                  size={13}
                  color={isActive ? "#fff" : "#a3a3a3"}
                />
                <Text
                  className="text-sm font-semibold"
                  style={{ color: isActive ? "#fff" : "#a3a3a3" }}
                >
                  {cat.name.split(" ")[0]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Section label */}
      <View className="px-4 mb-3 flex-row items-center gap-2">
        <Text className="text-white font-bold text-base">Gastos Recientes</Text>
        <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
      </View>
    </View>
  );
}
