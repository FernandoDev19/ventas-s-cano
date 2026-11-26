// @theme-migrated
import Button from "@/src/shared/components/ui/Button";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { useContextOrder } from "@/src/shared/hooks/useContextOrder";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { ProductType } from "../../inventory/types/product.type";
import { C } from "@/src/core/theme/palette";
import { useSettings } from "@/src/core/context/SettingsContext";

type Props = {
  product: ProductType;
};

const MenuProductCard = ({ product }: Props) => {
  const { addToOrder, order } = useContextOrder();
  const { allowNoStock } = useSettings();
  const outOfStock = product.stock <= 0;
  const blocked = outOfStock && !allowNoStock;

  const orderItem = order.find(
    (item) => item.type === "product" && item.product.id === product.id,
  );
  const qty = orderItem?.quantity ?? 0;

  return (
    <Pressable
      onPress={() => !blocked && addToOrder(product)}
      className={`${blocked ? "opacity-50 border-2 border-red-500" : ""} bg-neutral-200 dark:bg-neutral-800 rounded-2xl border-[0.3px] border-primary flex-1 overflow-hidden`}
    >
      <Image
        source={
          product.image_url
            ? { uri: product.image_url }
            : require("@/assets/images/default-food.png")
        }
        className="w-full h-40 m-0 p-0"
        resizeMode="cover"
      />

      {outOfStock && (
        <View className="absolute top-0 h-40 w-full items-center justify-center">
          <Text
            className={`text-2xl font-extrabold ${blocked ? "text-red-500" : "text-amber-400"}`}
          >
            {blocked ? "Sin Stock" : "Sin stock"}
          </Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-base text-neutral-900 dark:text-white">
          {product.name}
        </Text>

        <View className="flex-row items-end justify-between mt-2">
          <Text className="text-xl font-bold text-orange-400">
            {priceFormat(product.price)}
          </Text>

          <Button
            onPress={() => addToOrder(product)}
            className="w-10 h-10 !px-0 !py-0"
            disabled={blocked}
          >
            {qty > 0 ? (
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={11} color={C.text} />
                <Text className="text-sm absolute -top-4 -right-4 w-4 h-4 rounded-full bg-white text-black text-center m-0 p-0">
                  {qty}
                </Text>
              </View>
            ) : (
              <Ionicons name="add" size={11} color={C.text} />
            )}
          </Button>
        </View>
      </View>
    </Pressable>
  );
};

export default MenuProductCard;
