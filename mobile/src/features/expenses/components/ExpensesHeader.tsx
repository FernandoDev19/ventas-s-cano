// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { getIcon } from "../helpers/getIcon";
import { Pressable, ScrollView, Text, View } from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { CategoryType } from "../../categories/types/category.type";
import { ExpenseKind, ExpenseType } from "../types/expense.type";
import { C } from "@/src/core/theme/palette";
import ExportButton from "@/src/shared/components/ui/ExportButton";

type Props = {
  categories: CategoryType[];
  expenses: ExpenseType[];
  totalMonth: number;
  byCategory: { category: string; total: number }[];
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  selectedKind: "all" | ExpenseKind;
  setSelectedKind: (id: "all" | ExpenseKind) => void;
  onExport: () => Promise<void>;
};

export default function ExpensesHeader({
  categories,
  expenses,
  totalMonth,
  byCategory,
  selectedCategory,
  setSelectedCategory,
  selectedKind,
  setSelectedKind,
  onExport
}: Props) {
  return (
    <View className="pt-4">
      {/* Header */}
      <View className="px-4 mb-4">
        <Text className="text-2xl font-extrabold text-neutral-900 dark:text-white">
          Gastos
        </Text>
        <Text className="text-neutral-500 text-base">
          {expenses.length} registro{expenses.length !== 1 ? "s" : ""}
        </Text>
      </View>

                  <View className="px-4 mb-4 flex-row justify-between items-center">
                    <View>
                      <Text
                        style={{ color: C.text, fontSize: 24, fontWeight: "800" }}
                      >
                         Gastos
                      </Text>
                      <Text style={{ color: C.muted, fontSize: 16 }}>
                        {expenses.length} registro{expenses.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <ExportButton onExport={onExport} />
                  </View>

      {/* Total card */}
      <View
        className="mx-4 mb-4 p-5 rounded-2xl"
        style={{
          backgroundColor: C.card,
          borderLeftWidth: 4,
          borderLeftColor: "#ff5722",
        }}
      >
        <Text className="text-neutral-500 text-sm uppercase tracking-widest mb-1">
          Total Gastos
        </Text>
        <View className="flex-row items-end gap-3">
          <Text className="text-4xl font-extrabold text-neutral-900 dark:text-white">
            {priceFormat(totalMonth)}
          </Text>
        </View>

        {/* By category mini breakdown */}
        {byCategory.length > 0 && (
          <View
            className="mt-3 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: C.line }}
          >
            {byCategory.slice(0, 3).map((item) => (
              <View
                key={item.category}
                className="flex-row justify-between mb-1"
              >
                <Text className="text-neutral-500 text-sm">
                  {item.category}
                </Text>
                <Text className="text-neutral-700 dark:text-neutral-300 text-sm font-semibold">
                  -{priceFormat(item.total)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="flex-row gap-2 px-4 mb-3">
        {(
          [
            ["all", "Todos"],
            ["operativo", "Operativo"],
            ["inversion", "Inversión"],
            ["nomina", "Nómina"],
          ] as const
        ).map(([k, label]) => (
          <Pressable
            key={k}
            onPress={() => setSelectedKind(k)}
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: selectedKind === k ? "#ff5722" : C.card,
              borderWidth: 1,
              borderColor: selectedKind === k ? "#ff5722" : C.line2,
            }}
          >
            <Text
              style={{
                color: selectedKind === k ? "#fff" : C.soft,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
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
              backgroundColor: selectedCategory === null ? "#ff5722" : C.card,
              borderWidth: 1,
              borderColor: selectedCategory === null ? "#ff5722" : C.line2,
            }}
          >
            <Ionicons
              name="grid-outline"
              size={13}
              color={selectedCategory === null ? "#fff" : C.soft}
            />
            <Text
              className="text-base font-semibold"
              style={{
                color: selectedCategory === null ? "#fff" : C.soft,
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
                  backgroundColor: isActive ? "#ff5722" : C.card,
                  borderWidth: 1,
                  borderColor: isActive ? "#ff5722" : C.line2,
                }}
              >
                <Ionicons
                  name={getIcon(cat.name)}
                  size={13}
                  color={isActive ? "#fff" : C.soft}
                />
                <Text
                  className="text-base font-semibold"
                  style={{ color: isActive ? "#fff" : C.soft }}
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
        <Text className="text-neutral-900 dark:text-white font-bold text-lg">
          Gastos Recientes
        </Text>
        <View className="h-px flex-1" style={{ backgroundColor: C.line }} />
      </View>
    </View>
  );
}
