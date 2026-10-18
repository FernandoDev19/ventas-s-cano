import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CreateRecipeModal from "./components/CreateRecipeModal";
import { useRecipes } from "./hooks/useRecipes";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import RecipesHeader from "./components/RecipesHeader";
import RecipesListEmpty from "./components/RecipesListEmpty";
import RecipeCard from "./components/RecipeCard";

type Props = {
  activeTab: "productos" | "recetas";
  onChangeTab: (tab: "productos" | "recetas") => void;
};

export default function RecipesScreen({ activeTab, onChangeTab }: Props) {
  const {
    isLoading,
    isRefreshing,
    filtered,
    loadData,
    handleDelete,
    setShowCreate,
    setEditingRecipe,
    editingRecipe,
    categories,
    search,
    setSearch,
    allProducts,
    showCreate,
    recipes,
  } = useRecipes();

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
      <HeaderTabs
        tabs={["productos", "recetas"] as ("productos" | "recetas")[]}
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />

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
          <RecipesHeader
            recipes={recipes}
            search={search}
            setSearch={setSearch}
            filtered={filtered}
          />
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
        ListEmptyComponent={<RecipesListEmpty search={search} />}
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
