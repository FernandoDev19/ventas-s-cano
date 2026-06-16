import Input from "@/src/shared/components/ui/Input";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CategoryType } from "../../categories/types/category.type";
import MenuRecipeCard from "../../recipes/components/MenuRecipeCard";
import { RecipeType } from "../../recipes/types/recipe.type";

type Props = {
  categories: Partial<CategoryType>[];
  filter: string;
  setFilter: (filter: string) => void;
  search: string;
  setSearch: (s: string) => void;
  allRecipes: RecipeType[];
  availableRecipes: RecipeType[];
};

export default function MenuHeader({
  categories,
  filter,
  setFilter,
  search,
  setSearch,
  allRecipes,
  availableRecipes,
}: Props) {
  return (
    <>
      <View className="mb-2 mt-4 gap-2">
        <Text className="text-2xl font-extrabold text-white">Menú</Text>

        <Input
          type="search"
          placeholder="Buscar productos..."
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <View className="flex-row justify-around gap-2.5 my-5">
            {categories &&
              categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => setFilter(category.id!)}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor:
                      filter === category.id ? "#ff5722" : "#1a1a1a",
                    borderWidth: 1,
                    borderColor: filter === category.id ? "#ff5722" : "#333",
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color: filter === category.id ? "#fff" : "#a3a3a3",
                    }}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
          </View>
        </ScrollView>
      </View>

      {/* Recipes section — only show if there are recipes */}
      {allRecipes.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: "#737373",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: "700",
              }}
            >
              🍽 Platos / Combos
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#2a2a2a" }} />
            <Text
              style={{
                color: "#ff5722",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {availableRecipes.length}/{allRecipes.length} disponibles
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
            {allRecipes.map((recipe) => (
              <View key={recipe.id} style={{ width: "47%" }}>
                <MenuRecipeCard recipe={recipe} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Products section label */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: "#737373",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontWeight: "700",
          }}
        >
          Productos
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: "#2a2a2a" }} />
      </View>
    </>
  );
}
