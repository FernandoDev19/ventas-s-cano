// @theme-migrated
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { RecipeType } from "../types/recipe.type";
import { C } from "@/src/core/theme/palette";
import { getMargin } from "@/src/shared/helpers/margin.helper";

export default function RecipeCard({
  recipe,
  onEdit,
  onDelete,
}: {
  recipe: RecipeType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const available = recipe.canPrepare !== false;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 14,
        backgroundColor: C.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: available ? C.line : "#ef444422",
        overflow: "hidden",
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {/* Image */}
        <Image
          source={
            recipe.image_url
              ? { uri: recipe.image_url }
              : require("@/assets/images/default-food.png")
          }
          style={{ width: 110, height: 110 }}
          resizeMode="cover"
        />

        {/* Info */}
        <View style={{ flex: 1, padding: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: available ? "#10b98120" : "#ef444420",
              }}
            >
              <Text
                style={{
                  color: available ? "#10b981" : "#ef4444",
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                {available ? "● DISPONIBLE" : "● SIN STOCK"}
              </Text>
            </View>
          </View>

          <Text
            style={{ color: C.text, fontSize: 18, fontWeight: "800" }}
            numberOfLines={1}
          >
            {recipe.name}
          </Text>
          {recipe.description ? (
            <Text
              style={{ color: C.muted, fontSize: 13, marginTop: 2 }}
              numberOfLines={1}
            >
              {recipe.description}
            </Text>
          ) : null}

          <Text
            style={{
              color: "#ff5722",
              fontSize: 20,
              fontWeight: "900",
              marginTop: 6,
            }}
          >
            {priceFormat(recipe.selling_price)}
          </Text>

          {(() => {
            const m = getMargin(recipe.selling_price, recipe.cost);
            return m.hasCost ? (
              <Text
                style={{
                  color: m.color,
                  fontSize: 13,
                  fontWeight: "700",
                  marginTop: 2,
                }}
              >
                Costo {priceFormat(recipe.cost!)} · ganas {priceFormat(m.profit)} ({m.pct.toFixed(0)}%)
              </Text>
            ) : (
              <Text style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>
                Sin costo en ingredientes
              </Text>
            );
          })()}
        </View>
      </View>

      {/* Ingredients row */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 12,
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: C.line,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <Text
            style={{
              color: C.faint,
              fontSize: 12,
              width: "100%",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Ingredientes
          </Text>
          {recipe.ingredients.map((ing) => (
            <View
              key={ing.product_id}
              style={{
                backgroundColor: C.bg,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ color: C.soft, fontSize: 13 }}>
                ×{ing.quantity}
              </Text>
              <Text
                style={{ color: C.text, fontSize: 13, fontWeight: "600" }}
                numberOfLines={1}
              >
                {ing.product_name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: C.line,
        }}
      >
        <Pressable
          onPress={onEdit}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 12,
            borderRightWidth: 1,
            borderRightColor: C.line,
          }}
        >
          <Ionicons name="create-outline" size={16} color="#ff5722" />
          <Text style={{ color: "#ff5722", fontSize: 15, fontWeight: "700" }}>
            Editar
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 12,
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text style={{ color: "#ef4444", fontSize: 15, fontWeight: "700" }}>
            Eliminar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}