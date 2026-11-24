// @theme-migrated
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import {
  STOCK_CRITICAL_THRESHOLD,
  STOCK_LOW_THRESHOLD,
} from "../helpers/stock-status.helper";
import { ProductType } from "../types/product.type";
import { C } from "@/src/core/theme/palette";

type Props = {
  item: ProductType;
  status: { label: string; color: string; bg: string };
  isUpdating: boolean;
  handleAdjustStock: (item: ProductType, amount: number) => void;
  openEdit: (item: ProductType) => void;
};

export default function InventoryItemCard({
  item,
  status,
  isUpdating,
  handleAdjustStock,
  openEdit,
}: Props) {
  return (
    <View
      className="mx-4 mb-3 p-4 rounded-2xl"
      style={{
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor:
          item.stock <= STOCK_CRITICAL_THRESHOLD ? "#ef444433" : C.line,
      }}
    >
      {/* Top row */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row flex-1 mr-3 items-center">
          <Image
            source={
              item.image_url
                ? { uri: item.image_url }
                : require("@/assets/images/default-food.png")
            }
            style={{
              width: 50,
              height: 50,
              borderRadius: 10,
              marginRight: 12,
            }}
            resizeMode="cover"
          />
          <View className="flex-1">
            <Text
              className="text-neutral-900 dark:text-white font-bold text-lg"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text className="text-neutral-500 text-sm mt-0.5">
              {priceFormat(item.price)} / unidad
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text
            className="text-3xl font-extrabold"
            style={{
              color:
                item.stock <= STOCK_CRITICAL_THRESHOLD
                  ? "#ef4444"
                  : item.stock <= STOCK_LOW_THRESHOLD
                    ? "#f59e0b"
                    : "#fff",
            }}
          >
            {item.stock}
          </Text>
          <Text className="text-neutral-600 text-[12px] uppercase">
            unidades
          </Text>
        </View>
      </View>

      {/* Status badge */}
      <View
        className="self-start px-2 py-0.5 rounded-full mb-3"
        style={{ backgroundColor: status.bg }}
      >
        <Text className="text-[12px] font-bold" style={{ color: status.color }}>
          {status.label}
        </Text>
      </View>

      {/* Actions row */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => openEdit(item)}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{ backgroundColor: C.line }}
        >
          <Ionicons name="pencil-outline" size={14} color={C.soft} />
          <Text className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
            Editar
          </Text>
        </Pressable>

        {/* Stock stepper */}
        <View
          className="flex-row items-center gap-0 rounded-xl overflow-hidden"
          style={{ backgroundColor: C.line }}
        >
          <Pressable
            onPress={() => handleAdjustStock(item, -1)}
            disabled={isUpdating || item.stock === 0}
            className="px-3 py-2.5 items-center justify-center"
            style={{ opacity: item.stock === 0 ? 0.3 : 1 }}
          >
            <Ionicons name="remove" size={16} color={C.soft} />
          </Pressable>
          <View className="px-3 py-2">
            {isUpdating ? (
              <ActivityIndicator size="small" color="#ff5722" />
            ) : (
              <Text className="text-neutral-900 dark:text-white text-sm font-bold">
                Stock
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => handleAdjustStock(item, 1)}
            disabled={isUpdating}
            className="px-3 py-2.5 items-center justify-center"
          >
            <Ionicons name="add" size={16} color="#ff5722" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
