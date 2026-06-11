import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { useOrder } from "@/src/shared/hooks/useOrder";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { RecipeType } from "../../recipes/types/recipe.type";

type Props = {
  recipe: RecipeType;
};

const MenuRecipeCard = ({ recipe }: Props) => {
  const { addRecipeToOrder, removeFromOrder, order } = useOrder();

  const orderItem = order.find(
    (item) => item.type === "recipe" && item.recipe.id === recipe.id
  );
  const qty = orderItem?.quantity ?? 0;
  const canOrder = recipe.canPrepare !== false;

  return (
    <Pressable
      onPress={() => canOrder && addRecipeToOrder(recipe)}
      style={{
        backgroundColor: "#1a1a1a",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: canOrder ? "#ff572266" : "#3a3a3a",
        flex: 1,
        overflow: "hidden",
        opacity: canOrder ? 1 : 0.55,
      }}
    >
      {/* Image */}
      <View style={{ position: "relative" }}>
        <Image
          source={
            recipe.image_url
              ? { uri: recipe.image_url }
              : require("@/assets/images/default-food.png")
          }
          style={{ width: "100%", height: 140 }}
          resizeMode="cover"
        />
        {/* Recipe badge */}
        <View style={{
          position: "absolute",
          top: 8,
          left: 8,
          backgroundColor: "#ff5722",
          borderRadius: 6,
          paddingHorizontal: 7,
          paddingVertical: 3,
        }}>
          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
            RECETA
          </Text>
        </View>
        {!canOrder && (
          <View style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}>
            <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 13 }}>Sin ingredientes</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ padding: 12 }}>
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }} numberOfLines={1}>
          {recipe.name}
        </Text>
        {recipe.description ? (
          <Text style={{ color: "#737373", fontSize: 10, marginTop: 2 }} numberOfLines={1}>
            {recipe.description}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={{ color: "#ff5722", fontSize: 16, fontWeight: "800" }}>
            {priceFormat(recipe.selling_price)}
          </Text>

          <Pressable
            onPress={() => {
              if (!canOrder) return;
              if (qty > 0) removeFromOrder(recipe.id!, "recipe");
              else addRecipeToOrder(recipe);
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: qty > 0 ? "#ff5722" : "#ff572233",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {qty > 0 ? (
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>{qty}</Text>
            ) : (
              <Ionicons name="add" size={16} color="#ff5722" />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export default MenuRecipeCard;
