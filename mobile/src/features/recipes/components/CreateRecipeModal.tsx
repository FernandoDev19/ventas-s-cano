import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RecipesService } from "../services/recipes.service";
import { RecipeType, RecipeIngredientType } from "../types/recipe.type";
import { ProductType } from "@/src/features/inventory/types/product.type";
import { CategoryType } from "@/src/features/categories/types/category.type";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { useFiles } from "@/src/shared/hooks/useFiles";
import { SupabaseStorageService } from "@/src/shared/services/supabase-storage.service";
import { v4 as uuidv4 } from "uuid";
import CategoriesModal from "../../categories/components/CategoriesModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  allProducts: ProductType[];
  categories: CategoryType[];
  editRecipe?: RecipeType | null;
};

export default function CreateRecipeModal({
  visible,
  onClose,
  onSaved,
  allProducts,
  categories,
  editRecipe,
}: Props) {
  const isEditing = !!editRecipe;

  const [name, setName] = useState(editRecipe?.name ?? "");
  const [description, setDescription] = useState(editRecipe?.description ?? "");
  const [price, setPrice] = useState(
    editRecipe?.selling_price ? String(editRecipe.selling_price) : "",
  );
  const [imageUri, setImageUri] = useState<string | null>(
    editRecipe?.image_url ?? null,
  );
  const [ingredients, setIngredients] = useState<RecipeIngredientType[]>(
    editRecipe?.ingredients ?? [],
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    editRecipe?.category_id ?? null,
  );
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const { elegirImagenProducto } = useFiles();

  useEffect(() => {
    if (visible) {
      setName(editRecipe?.name ?? "");
      setDescription(editRecipe?.description ?? "");
      setPrice(
        editRecipe?.selling_price ? String(editRecipe.selling_price) : "",
      );
      setImageUri(editRecipe?.image_url ?? null);
      setIngredients(editRecipe?.ingredients ?? []);
      setCategoryId(editRecipe?.category_id ?? null);
    }
  }, [visible, editRecipe]);

  const reset = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImageUri(null);
    setIngredients([]);
    setCategoryId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickImage = async () => {
    setIsPickingImage(true);
    try {
      const uri = await elegirImagenProducto();
      if (uri) setImageUri(uri);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleAddIngredient = (product: ProductType) => {
    setIngredients((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_image: product.image_url,
          quantity: 1,
        },
      ];
    });
    setShowIngredientPicker(false);
  };

  const handleChangeQty = (productId: string, delta: number) => {
    setIngredients((prev) =>
      prev
        .map((i) =>
          i.product_id === productId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Falta nombre", "Ingresa el nombre de la receta.");
      return;
    }
    const parsedPrice = parseFloat(price.replace(/,/g, ""));
    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert("Precio inválido", "Ingresa un precio de venta mayor a 0.");
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert("Sin ingredientes", "Agrega al menos un ingrediente.");
      return;
    }

    setIsSaving(true);
    let finalImageUrl = imageUri;

    try {
      // 1. Si la imagen cambió y es una URI local, subirla a Supabase
      if (
        imageUri &&
        !imageUri.startsWith("http") &&
        imageUri !== editRecipe?.image_url
      ) {
        setIsUploadingImage(true);

        // Eliminar imagen anterior si estamos editando
        if (isEditing && editRecipe?.image_url) {
          const oldFileName = SupabaseStorageService.extractFileNameFromUrl(
            editRecipe.image_url,
          );
          if (oldFileName) {
            await SupabaseStorageService.deleteProductImage(oldFileName);
          }
        }

        // Subir nueva imagen
        const fileName = `recipe_${uuidv4()}.jpg`;
        const uploadedUrl = await SupabaseStorageService.uploadProductImage(
          imageUri,
          fileName,
        );

        if (!uploadedUrl) {
          Alert.alert(
            "Aviso",
            "La receta se guardó pero la imagen no se pudo subir. Intenta nuevamente desde edición.",
          );
          finalImageUrl = "";
        } else {
          finalImageUrl = uploadedUrl;
        }

        setIsUploadingImage(false);
      }

      const recipeData = {
        name: name.trim(),
        description: description.trim(),
        image_url: finalImageUrl ?? "",
        selling_price: parsedPrice,
        category_id: categoryId,
      };
      const ings = ingredients.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      }));

      if (isEditing && editRecipe?.id) {
        await RecipesService.update(editRecipe.id, recipeData, ings);
      } else {
        await RecipesService.create(recipeData, ings);
      }
      reset();
      onSaved();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo guardar la receta.");
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#141414",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: 40,
              maxHeight: "92%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View>
                <Text
                  style={{
                    color: "#ff5722",
                    fontSize: 10,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {isEditing ? "Editar Receta" : "Nueva Receta"}
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 22,
                    fontWeight: "900",
                  }}
                >
                  {isEditing ? name || "Receta" : "Crear Receta"}
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image picker */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Pressable
                  onPress={handlePickImage}
                  disabled={isPickingImage || isUploadingImage}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 18,
                    backgroundColor: "#1a1a1a",
                    borderWidth: 2,
                    borderColor: imageUri ? "#ff5722" : "#2a2a2a",
                    borderStyle: imageUri ? "solid" : "dashed",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {isPickingImage || isUploadingImage ? (
                    <ActivityIndicator color="#ff5722" />
                  ) : imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: 100, height: 100 }}
                    />
                  ) : (
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <Ionicons
                        name="restaurant-outline"
                        size={32}
                        color="#555"
                      />
                      <Text style={{ color: "#555", fontSize: 10 }}>Foto</Text>
                    </View>
                  )}
                </Pressable>
                {imageUri && !isUploadingImage && (
                  <Pressable
                    onPress={() => setImageUri(null)}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={{ color: "#555", fontSize: 11 }}>
                      Quitar imagen
                    </Text>
                  </Pressable>
                )}
                {isUploadingImage && (
                  <Text
                    style={{ color: "#ff5722", fontSize: 11, marginTop: 6 }}
                  >
                    Subiendo imagen...
                  </Text>
                )}
              </View>

              {/* Name */}
              <Text style={styles.label}>Nombre del Plato</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Ej. Combo Pollo Entero"
                  placeholderTextColor="#555"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
              </View>

              {/* Description */}
              <Text style={styles.label}>Descripción (opcional)</Text>
              <View style={[styles.inputWrapper, { marginBottom: 16 }]}>
                <TextInput
                  placeholder="Ej. Incluye papas y bebida"
                  placeholderTextColor="#555"
                  value={description}
                  onChangeText={setDescription}
                  style={styles.input}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Price */}
              <Text style={styles.label}>Precio de Venta</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                  },
                ]}
              >
                <Text
                  style={{
                    color: "#ff5722",
                    fontSize: 18,
                    fontWeight: "900",
                    marginRight: 6,
                  }}
                >
                  $
                </Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#555"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1 }]}
                />
              </View>

              {/* Category */}
              <Text style={styles.label}>Categoría</Text>
              <Pressable
                onPress={() => setIsCategoriesModalOpen(true)}
                className="h-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 flex-row items-center gap-2 mb-6"
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons
                    name="folder-outline"
                    size={18}
                    color={categoryId ? "#ff5722" : "#737373"}
                  />
                  <Text
                    style={{
                      color: categoryId ? "#fff" : "#737373",
                      fontSize: 15,
                    }}
                  >
                    {categoryId
                      ? categories.find((c) => c.id === categoryId)?.name
                      : "Selecciona una categoría"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#555" />
              </Pressable>

              <CategoriesModal
                onSelect={(id) => {
                  setIsCategoriesModalOpen(false);
                  setCategoryId(id);
                }}
                visible={isCategoriesModalOpen}
                onCreated={(id) => {
                  setIsCategoriesModalOpen(false);
                  setCategoryId(id);
                }}
                onClose={() => setIsCategoriesModalOpen(false)}
              />

              {/* Ingredients */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={styles.label}>Ingredientes</Text>
                <Pressable
                  onPress={() => setShowIngredientPicker(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "#ff572222",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                  }}
                >
                  <Ionicons name="add" size={14} color="#ff5722" />
                  <Text
                    style={{
                      color: "#ff5722",
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    Agregar
                  </Text>
                </Pressable>
              </View>

              {ingredients.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderRadius: 14,
                    padding: 20,
                    alignItems: "center",
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: "#2a2a2a",
                    borderStyle: "dashed",
                  }}
                >
                  <Ionicons name="basket-outline" size={28} color="#444" />
                  <Text style={{ color: "#555", fontSize: 12, marginTop: 8 }}>
                    Sin ingredientes. Agrega productos del inventario.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8, marginBottom: 20 }}>
                  {ingredients.map((ing) => (
                    <View
                      key={ing.product_id}
                      style={{
                        flexDirection: "row",
                        backgroundColor: "#1a1a1a",
                        borderRadius: 14,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: "#2a2a2a",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={
                          ing.product_image
                            ? { uri: ing.product_image }
                            : require("@/assets/images/default-food.png")
                        }
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 8,
                          marginRight: 10,
                        }}
                        resizeMode="cover"
                      />
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: "600",
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {ing.product_name}
                      </Text>
                      {/* Qty controls */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#0f0f0f",
                          borderRadius: 10,
                          padding: 4,
                          gap: 8,
                          marginRight: 8,
                        }}
                      >
                        <Pressable
                          onPress={() => handleChangeQty(ing.product_id, -1)}
                          style={{ padding: 2 }}
                        >
                          <Ionicons
                            name="remove-circle-outline"
                            size={20}
                            color="#fff"
                          />
                        </Pressable>
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "800",
                            fontSize: 13,
                            minWidth: 16,
                            textAlign: "center",
                          }}
                        >
                          {ing.quantity}
                        </Text>
                        <Pressable
                          onPress={() => handleChangeQty(ing.product_id, 1)}
                          style={{ padding: 2 }}
                        >
                          <Ionicons
                            name="add-circle-outline"
                            size={20}
                            color="#fff"
                          />
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={() =>
                          setIngredients((p) =>
                            p.filter((i) => i.product_id !== ing.product_id),
                          )
                        }
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#ef4444"
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Save button */}
              <Pressable
                onPress={handleSave}
                disabled={isSaving || isUploadingImage}
                style={{
                  backgroundColor: "#ff5722",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  opacity: isSaving || isUploadingImage ? 0.7 : 1,
                  marginBottom: 16,
                }}
              >
                {isSaving || isUploadingImage ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}
                  >
                    {isEditing ? "Guardar Cambios" : "Crear Receta"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>

            {/* Ingredient picker modal */}
            <Modal
              visible={showIngredientPicker}
              transparent
              animationType="slide"
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  justifyContent: "flex-end",
                }}
              >
                <View
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    padding: 20,
                    maxHeight: "60%",
                    paddingBottom: 40,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "800",
                      }}
                    >
                      Seleccionar Ingrediente
                    </Text>
                    <Pressable
                      onPress={() => setShowIngredientPicker(false)}
                      style={{
                        backgroundColor: "#2a2a2a",
                        borderRadius: 20,
                        padding: 8,
                      }}
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                    </Pressable>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 8 }}>
                      {allProducts.map((prod) => (
                        <Pressable
                          key={prod.id}
                          onPress={() => handleAddIngredient(prod)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#141414",
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: ingredients.some(
                              (i) => i.product_id === prod.id,
                            )
                              ? "#ff5722"
                              : "#2a2a2a",
                            gap: 12,
                          }}
                        >
                          <Image
                            source={
                              prod.image_url
                                ? { uri: prod.image_url }
                                : require("@/assets/images/default-food.png")
                            }
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                            }}
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "600",
                                fontSize: 14,
                              }}
                            >
                              {prod.name}
                            </Text>
                            <Text
                              style={{
                                color: "#737373",
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              Stock: {prod.stock} · {priceFormat(prod.price)}
                            </Text>
                          </View>
                          {ingredients.some(
                            (i) => i.product_id === prod.id,
                          ) && (
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color="#ff5722"
                            />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = {
  label: {
    color: "#737373",
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  input: {
    color: "#fff",
    fontSize: 16,
    height: 46,
  },
};
