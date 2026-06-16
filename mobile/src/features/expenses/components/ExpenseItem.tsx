import { priceFormat } from "@/src/shared/helpers/price-format.helper"
import { Ionicons } from "@expo/vector-icons"
import { Pressable, Text, View } from "react-native"
import { getIcon } from "../helpers/getIcon";
import { ExpenseType } from "../types/expense.type";
import { CategoryType } from "../../categories/types/category.type";

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${formatDate(date)}, ${d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
}

type Props = {
  item: ExpenseType;
  cat: CategoryType | undefined;
  setSelectedExpense: (item: ExpenseType) => void;
  handleDelete: (item: ExpenseType) => void;
}

export default function ExpenseItem({item, cat, setSelectedExpense, handleDelete}: Props) {
  return (
    <Pressable
              onPress={() => setSelectedExpense(item)}
              onLongPress={() => handleDelete(item)}
              className="mx-4 mb-3 p-4 rounded-2xl flex-row items-center gap-3 active:opacity-85"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              {/* Icon */}
              <View
                className="w-11 h-11 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#ff572222" }}
              >
                <Ionicons
                  name={getIcon(cat?.name ?? "")}
                  size={22}
                  color="#ff5722"
                />
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text
                  className="text-white font-semibold text-sm"
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
                <Text className="text-neutral-500 text-xs mt-0.5">
                  {formatDateTime(item.date)}
                  {cat ? ` • ${cat.name.split(" ")[0]}` : ""}
                </Text>
              </View>

              {/* Amount */}
              <Text
                className="text-base font-extrabold"
                style={{ color: "#ff5722" }}
              >
                -{priceFormat(item.amount)}
              </Text>
            </Pressable>
  )
}