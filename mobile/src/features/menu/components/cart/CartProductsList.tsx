// @theme-migrated
import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { OrderItem, originalPriceOf } from "@/src/core/context/OrderContext";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { C } from "@/src/core/theme/palette";

type Props = {
  order: OrderItem[];
  getItemImage: (item: OrderItem) => string | undefined;
  getItemLabel: (item: OrderItem) => string;
  getItemPrice: (item: OrderItem) => number;
  handleDecrement: (item: OrderItem) => void;
  handleIncrement: (item: OrderItem) => void;
  ListFooterComponent?: React.ReactElement | null;
  onEditPrice: (item: OrderItem) => void;
};

export default function CartProductsList({
  order,
  getItemImage,
  getItemLabel,
  getItemPrice,
  handleDecrement,
  handleIncrement,
  ListFooterComponent,
  onEditPrice,
}: Props) {
  return (
    <FlatList
      style={{ flex: 1 }}
      data={order}
      keyExtractor={(item, idx) =>
        item.type === "product"
          ? `p-${item.product.id}`
          : `r-${item.recipe.id}-${idx}`
      }
      contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={ListFooterComponent}
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.line,
          }}
          className="flex-row p-4 rounded-2xl items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-4">
            <Image
              source={
                getItemImage(item)
                  ? { uri: getItemImage(item) }
                  : require("@/assets/images/default-food.png")
              }
              className="w-14 h-14 rounded-xl mr-3"
              style={{ backgroundColor: C.line }}
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
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      RECETA
                    </Text>
                  </View>
                )}
                <Text
                  style={{ color: C.text }}
                  className="font-bold text-lg flex-1"
                  numberOfLines={1}
                >
                  {getItemLabel(item)}
                </Text>
              </View>
              <Pressable
                onPress={() => onEditPrice(item)}
                hitSlop={8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Text className="text-primary font-bold">
                  {priceFormat(getItemPrice(item))}
                </Text>
                <Ionicons name="pencil" size={13} color="#ff5722" />
                {item.customPrice !== undefined && (
                  <Text
                    style={{
                      color: C.muted,
                      fontSize: 12,
                      textDecorationLine: "line-through",
                    }}
                  >
                    {priceFormat(originalPriceOf(item) * item.quantity)}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Controles de unidades */}
          <View
            style={{
              backgroundColor: C.sheet,
              borderWidth: 1,
              borderColor: C.line,
            }}
            className="flex-row items-center rounded-xl p-1 gap-2.5"
          >
            <Pressable
              onPress={() => handleDecrement(item)}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="remove-circle-outline" size={24} color={C.text} />
            </Pressable>
            <Text
              style={{ color: C.text }}
              className="font-black text-base min-w-[14px] text-center"
            >
              {item.quantity}
            </Text>
            <Pressable
              onPress={() => handleIncrement(item)}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="add-circle-outline" size={24} color={C.text} />
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}
