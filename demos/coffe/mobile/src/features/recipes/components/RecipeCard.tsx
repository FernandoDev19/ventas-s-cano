import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { RecipeType } from "../types/recipe.type";

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
        backgroundColor: "#1a1a1a",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: available ? "#2a2a2a" : "#ef444422",
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
                  fontSize: 9,
                  fontWeight: "800",
                }}
              >
                {available ? "● DISPONIBLE" : "● SIN STOCK"}
              </Text>
            </View>
          </View>

          <Text
            style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}
            numberOfLines={1}
          >
            {recipe.name}
          </Text>
          {recipe.description ? (
            <Text
              style={{ color: "#737373", fontSize: 11, marginTop: 2 }}
              numberOfLines={1}
            >
              {recipe.description}
            </Text>
          ) : null}

          <Text
            style={{
              color: "#ff5722",
              fontSize: 18,
              fontWeight: "900",
              marginTop: 6,
            }}
          >
            {priceFormat(recipe.selling_price)}
          </Text>
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
            borderTopColor: "#2a2a2a",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <Text
            style={{
              color: "#555",
              fontSize: 10,
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
                backgroundColor: "#0f0f0f",
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ color: "#a3a3a3", fontSize: 11 }}>
                ×{ing.quantity}
              </Text>
              <Text
                style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}
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
          borderTopColor: "#2a2a2a",
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
            borderRightColor: "#2a2a2a",
          }}
        >
          <Ionicons name="create-outline" size={16} color="#ff5722" />
          <Text style={{ color: "#ff5722", fontSize: 13, fontWeight: "700" }}>
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
          <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "700" }}>
            Eliminar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
