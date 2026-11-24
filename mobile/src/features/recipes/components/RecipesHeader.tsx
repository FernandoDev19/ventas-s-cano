// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { RecipeType } from "../types/recipe.type";
import { C } from "@/src/core/theme/palette";

type Props = {
  recipes: RecipeType[];
  search: string;
  setSearch: (search: string) => void;
  filtered: RecipeType[];
};

export default function RecipesHeader({
  recipes,
  search,
  setSearch,
  filtered,
}: Props) {
  return (
    <View style={{ paddingTop: 20 }}>
      {/* Title */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Text
          style={{
            color: "#ff5722",
            fontSize: 13,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          Gestión
        </Text>
        <Text
          style={{
            color: C.text,
            fontSize: 28,
            fontWeight: "900",
            marginTop: 2,
          }}
        >
          Recetas
        </Text>
        <Text style={{ color: C.muted, fontSize: 15, marginTop: 4 }}>
          Platos compuestos que descontan ingredientes del inventario
        </Text>
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          gap: 10,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: C.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: C.line,
          }}
        >
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Total Recetas
          </Text>
          <Text
            style={{
              color: C.text,
              fontSize: 24,
              fontWeight: "900",
              marginTop: 4,
            }}
          >
            {recipes.length}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor:
              recipes.filter((r) => r.canPrepare).length > 0
                ? "#10b98115"
                : C.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor:
              recipes.filter((r) => r.canPrepare).length > 0
                ? "#10b98144"
                : C.line,
          }}
        >
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Disponibles
          </Text>
          <Text
            style={{
              color: "#10b981",
              fontSize: 24,
              fontWeight: "900",
              marginTop: 4,
            }}
          >
            {recipes.filter((r) => r.canPrepare).length}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor:
              recipes.filter((r) => !r.canPrepare).length > 0
                ? "#ef444415"
                : C.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor:
              recipes.filter((r) => !r.canPrepare).length > 0
                ? "#ef444444"
                : C.line,
          }}
        >
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Sin stock
          </Text>
          <Text
            style={{
              color:
                recipes.filter((r) => !r.canPrepare).length > 0
                  ? "#ef4444"
                  : "#fff",
              fontSize: 24,
              fontWeight: "900",
              marginTop: 4,
            }}
          >
            {recipes.filter((r) => !r.canPrepare).length}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: C.card,
          borderRadius: 12,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: C.line,
        }}
      >
        <Ionicons name="search-outline" size={18} color={C.muted} />
        <TextInput
          placeholder="Buscar receta..."
          placeholderTextColor={C.faint}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, color: C.text, fontSize: 16, height: 46 }}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={C.faint} />
          </Pressable>
        )}
      </View>

      {/* Section label */}
      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Text
          style={{
            color: C.muted,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          {filtered.length} receta{filtered.length !== 1 ? "s" : ""}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
      </View>
    </View>
  );
}
