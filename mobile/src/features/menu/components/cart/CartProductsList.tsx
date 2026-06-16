import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { OrderItem } from "@/src/core/context/OrderContext";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";

type Props = {
  order: OrderItem[];
  getItemImage: (item: OrderItem) => string | undefined;
  getItemLabel: (item: OrderItem) => string;
  getItemPrice: (item: OrderItem) => number;
  handleDecrement: (item: OrderItem) => void;
  handleIncrement: (item: OrderItem) => void;
};

export default function CartProductsList({
  order,
  getItemImage,
  getItemLabel,
  getItemPrice,
  handleDecrement,
  handleIncrement,
}: Props) {
  return (
    <FlatList
      data={order}
      keyExtractor={(item, idx) =>
        item.type === "product"
          ? `p-${item.product.id}`
          : `r-${item.recipe.id}-${idx}`
      }
      contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View className="flex-row bg-neutral-800 p-4 rounded-2xl items-center justify-between">
          <View className="flex-row items-center flex-1 mr-4">
            <Image
              source={
                getItemImage(item)
                  ? { uri: getItemImage(item) }
                  : require("@/assets/images/default-food.png")
              }
              className="w-14 h-14 rounded-xl bg-neutral-700 mr-3"
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-1 flex-1">
                {item.type === "recipe" && (
                  <View
                    style={{
                      backgroundColor: "#ff572220",
                      borderRadius: 4,
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      marginRight: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ff5722",
                        fontSize: 9,
                        fontWeight: "800",
                      }}
                    >
                      RECETA
                    </Text>
                  </View>
                )}
                <Text
                  className="text-white font-bold text-base flex-1"
                  numberOfLines={1}
                >
                  {getItemLabel(item)}
                </Text>
              </View>
              <Text className="text-primary font-bold mt-0.5">
                {priceFormat(getItemPrice(item))}
              </Text>
            </View>
          </View>

          {/* Controles de unidades */}
          <View className="flex-row items-center bg-neutral-900 rounded-xl p-1 gap-2.5">
            <Pressable
              onPress={() => handleDecrement(item)}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="remove-circle-outline" size={24} color="white" />
            </Pressable>
            <Text className="text-white font-black text-sm min-w-[14px] text-center">
              {item.quantity}
            </Text>
            <Pressable
              onPress={() => handleIncrement(item)}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}
