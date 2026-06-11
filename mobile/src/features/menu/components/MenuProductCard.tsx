import Button from "@/src/shared/components/ui/Button";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { useOrder } from "@/src/shared/hooks/useOrder";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { ProductType } from "../../products/types/product.type";

type Props = {
  product: ProductType;
};

const MenuProductCard = ({ product }: Props) => {
  const { addToOrder, removeFromOrder, order } = useOrder();

  const orderItem = order.find(
    (item) => item.type === "product" && item.product.id === product.id
  );
  const qty = orderItem?.quantity ?? 0;

  return (
    <Pressable onPress={() => addToOrder(product)} className={`${!product.stock ? "opacity-50 pointer-not-allowed border-2 border-red-500" : ""} bg-neutral-800 rounded-2xl border-[0.3px] border-primary flex-1 overflow-hidden`}>
      <Image
        source={
          product.image_url
            ? { uri: product.image_url }
            : require("@/assets/images/default-food.png")
        }
        className="w-full h-40 m-0 p-0"
        resizeMode="cover"
      />

      {!product.stock && (
        <View className="absolute top-0 flex-1 h-40 w-full items-center justify-center">
          <Text className="text-xl text-red-500 font-extrabold opacity-100 z-1">Sin Stock</Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-sm text-white">{product.name}</Text>

        <View className="flex-row items-end justify-between mt-2">
          <Text className="text-lg font-bold text-orange-400">
            {priceFormat(product.price)}
          </Text>

          <Button
            onPress={() => addToOrder(product)}
            className="w-10 h-10 !px-0 !py-0"
            disabled={!product.stock}
          >
            {qty > 0 ? (
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={11} color="white" />
                <Text className="text-xs absolute -top-4 -right-4 w-4 h-4 rounded-full bg-white text-black text-center m-0 p-0">
                  {qty}
                </Text>
              </View>
            ) : (
              <Ionicons name="add" size={11} color="white" />
            )}
          </Button>
        </View>
      </View>
    </Pressable>
  );
};

export default MenuProductCard;
