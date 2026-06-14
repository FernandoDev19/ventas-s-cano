import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RecipeType } from "../types/recipe.type";
import { RecipesService } from "../services/recipes.service";
import { ProductsService } from "@/src/features/inventory/services/products.service";
import { ProductType } from "@/src/features/inventory/types/product.type";
import { CategoriesService } from "@/src/features/categories/services/categories.service";
import { CategoryType } from "@/src/features/categories/types/category.type";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import CreateRecipeModal from "./CreateRecipeModal";

type Props = {
  activeTab: "productos" | "recetas";
  onChangeTab: (tab: "productos" | "recetas") => void;
};

export default function RecipesScreen({ activeTab, onChangeTab }: Props) {
  const [recipes, setRecipes] = useState<RecipeType[]>([]);
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeType | null>(null);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const [r, p, c] = await Promise.all([
        RecipesService.getAll(),
        ProductsService.getProducts(),
        CategoriesService.getAll(),
      ]);
      setRecipes(r);
      setAllProducts(p);
      setCategories(c);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = (recipe: RecipeType) => {
    Alert.alert(
      "Eliminar Receta",
      `¿Seguro que deseas eliminar la receta "${recipe.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await RecipesService.delete(recipe.id!);
              loadData();
            } catch {
              Alert.alert("Error", "No se pudo eliminar la receta.");
            }
          },
        },
      ],
    );
  };

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0f0f0f",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
        <Text style={{ color: "#737373", marginTop: 12, fontSize: 13 }}>
          Cargando recetas...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <View className="flex-row bg-background border-b border-neutral-800">
        {(["productos", "recetas"] as ("productos" | "recetas")[]).map(
          (tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-4 items-center border-b-2 ${
                activeTab === tab ? "border-orange-500" : "border-transparent"
              }`}
              onPress={() => onChangeTab(tab)}
            >
              <Text
                className={`font-bold text-xs uppercase tracking-wider ${
                  activeTab === tab ? "text-orange-600" : "text-neutral-400"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>
      
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor="#ff5722"
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: 20 }}>
            {/* Title */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text
                style={{
                  color: "#ff5722",
                  fontSize: 11,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Gestión
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "900",
                  marginTop: 2,
                }}
              >
                Recetas
              </Text>
              <Text style={{ color: "#737373", fontSize: 13, marginTop: 4 }}>
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
                  backgroundColor: "#1a1a1a",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Total Recetas
                </Text>
                <Text
                  style={{
                    color: "#fff",
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
                      : "#1a1a1a",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor:
                    recipes.filter((r) => r.canPrepare).length > 0
                      ? "#10b98144"
                      : "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 10,
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
                      : "#1a1a1a",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor:
                    recipes.filter((r) => !r.canPrepare).length > 0
                      ? "#ef444444"
                      : "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 10,
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
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: "#2a2a2a",
              }}
            >
              <Ionicons name="search-outline" size={18} color="#737373" />
              <TextInput
                placeholder="Buscar receta..."
                placeholderTextColor="#555"
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, color: "#fff", fontSize: 14, height: 46 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#555" />
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
                  color: "#737373",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                {filtered.length} receta{filtered.length !== 1 ? "s" : ""}
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#2a2a2a" }}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onEdit={() => {
              setEditingRecipe(item);
              setShowCreate(true);
            }}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
              paddingHorizontal: 32,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#1a1a1a",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="restaurant-outline" size={36} color="#444" />
            </View>
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {search
                ? `Sin resultados para "${search}"`
                : "No hay recetas creadas"}
            </Text>
            <Text
              style={{ color: "#737373", fontSize: 13, textAlign: "center" }}
            >
              {search
                ? "Prueba con otro nombre"
                : "Crea tu primera receta con el botón +"}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        onPress={() => {
          setEditingRecipe(null);
          setShowCreate(true);
        }}
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#ff5722",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#ff5722",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <CreateRecipeModal
        visible={showCreate}
        onClose={() => {
          setShowCreate(false);
          setEditingRecipe(null);
        }}
        onSaved={() => {
          setShowCreate(false);
          setEditingRecipe(null);
          loadData();
        }}
        allProducts={allProducts}
        categories={categories}
        editRecipe={editingRecipe}
      />
    </View>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function RecipeCard({
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
