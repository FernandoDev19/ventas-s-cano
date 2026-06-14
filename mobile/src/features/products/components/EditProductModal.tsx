import { useEffect, useState } from "react";
import { CategoryType } from "../../categories/types/category.type";
import { ProductType } from "../types/product.type";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { ProductsService } from "../services/products.service";
import { Ionicons } from "@expo/vector-icons";
import { useFiles } from "@/src/shared/hooks/useFiles";
import { SupabaseStorageService } from "@/src/shared/services/supabase-storage.service";
import { v4 as uuidv4 } from "uuid";
import CategoriesModal from "../../categories/components/CategoriesModal";

type EditProductModalProps = {
  visible: boolean;
  product: ProductType | null;
  categories: CategoryType[];
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditProductModal({
  visible,
  product,
  categories,
  onClose,
  onUpdated,
}: EditProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const { elegirImagenProducto } = useFiles();

  // Pre-llenar campos cuando se abre el modal con un producto
  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(String(product.price));
      setStock(String(product.stock));
      setCategoryId(product.category_id);
      setImageUri(product.image_url || null);
    }
  }, [product]);

  const handleClose = () => {
    onClose();
  };

  const handlePickImage = async () => {
    setIsPickingImage(true);
    try {
      const uri = await elegirImagenProducto(product?.id);
      if (uri) setImageUri(uri);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    if (!name.trim()) {
      Alert.alert("Falta nombre", "Por favor ingresa el nombre del producto.");
      return;
    }
    const parsedPrice = parseFloat(price.replace(/,/g, ""));
    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert("Precio inválido", "Por favor ingresa un precio mayor a 0.");
      return;
    }
    if (!categoryId) {
      Alert.alert("Falta categoría", "Por favor selecciona una categoría.");
      return;
    }

    setIsSaving(true);
    let finalImageUrl = imageUri;

    try {
      // 1. Si la imagen cambió y es una URI local (no una URL de Supabase), subirla
      if (
        imageUri &&
        !imageUri.startsWith("http") &&
        imageUri !== product.image_url
      ) {
        setIsUploadingImage(true);

        // Eliminar imagen anterior si existe
        if (product.image_url) {
          const oldFileName = SupabaseStorageService.extractFileNameFromUrl(
            product.image_url,
          );
          if (oldFileName) {
            await SupabaseStorageService.deleteProductImage(oldFileName);
          }
        }

        // Subir nueva imagen
        const fileName = `product_${uuidv4()}.jpg`;
        const uploadedUrl = await SupabaseStorageService.uploadProductImage(
          imageUri,
          fileName,
        );

        if (!uploadedUrl) {
          Alert.alert(
            "Aviso",
            "El producto se guardó pero la imagen no se pudo subir.",
          );
          finalImageUrl = "";
        } else {
          finalImageUrl = uploadedUrl;
        }

        setIsUploadingImage(false);
      }

      await ProductsService.updateProduct(product.id, {
        name: name.trim(),
        price: parsedPrice,
        stock: parseInt(stock) || 0,
        category_id: categoryId,
        image_url: finalImageUrl || "",
      });

      onUpdated();
      Alert.alert("Éxito", "Producto actualizado correctamente.");
    } catch (err) {
      Alert.alert("Error", "No se pudo actualizar el producto.");
      console.error(err);
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  const handleDelete = () => {
    if (!product) return;
    Alert.alert(
      "Eliminar producto",
      `¿Seguro que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Eliminar imagen de Supabase si existe
              if (product.image_url) {
                const fileName = SupabaseStorageService.extractFileNameFromUrl(
                  product.image_url,
                );
                if (fileName) {
                  await SupabaseStorageService.deleteProductImage(fileName);
                }
              }

              await ProductsService.deleteProduct(product.id);
              onUpdated();
              Alert.alert("Éxito", "Producto eliminado correctamente.");
            } catch {
              Alert.alert("Error", "No se pudo eliminar el producto.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (!product) return null;

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
            backgroundColor: "rgba(0,0,0,0.6)",
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
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View>
                <Text
                  style={{
                    color: "#ff5722",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Editar
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}
                  numberOfLines={1}
                >
                  {product.name}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {/* Botón eliminar */}
                <Pressable
                  onPress={handleDelete}
                  disabled={isDeleting}
                  style={{
                    backgroundColor: "#2a0a0a",
                    borderRadius: 20,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: "#5a1a1a",
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  )}
                </Pressable>
                {/* Botón cerrar */}
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
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selector de imagen */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Pressable
                  onPress={handlePickImage}
                  disabled={isPickingImage || isUploadingImage}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 16,
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
                    <>
                      <Image
                        source={{ uri: imageUri }}
                        style={{ width: 90, height: 90, borderRadius: 14 }}
                      />
                      {/* Overlay de edición */}
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: "rgba(0,0,0,0.55)",
                          alignItems: "center",
                          paddingVertical: 4,
                        }}
                      >
                        <Ionicons
                          name="camera-outline"
                          size={14}
                          color="#fff"
                        />
                      </View>
                    </>
                  ) : (
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <Ionicons name="camera-outline" size={28} color="#555" />
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

              {/* Nombre */}
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Nombre
              </Text>
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                }}
              >
                <TextInput
                  placeholder="Nombre del producto"
                  placeholderTextColor="#555"
                  value={name}
                  onChangeText={setName}
                  style={{ color: "#fff", fontSize: 16, height: 46 }}
                />
              </View>

              {/* Precio y Stock en fila */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#737373",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    Precio
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#1a1a1a",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: "#2a2a2a",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ff5722",
                        fontSize: 16,
                        fontWeight: "800",
                        marginRight: 4,
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
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        flex: 1,
                        height: 46,
                      }}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#737373",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    Stock
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#1a1a1a",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: "#2a2a2a",
                    }}
                  >
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#555"
                      value={stock}
                      onChangeText={setStock}
                      keyboardType="numeric"
                      style={{ color: "#fff", fontSize: 16, height: 46 }}
                    />
                  </View>
                </View>
              </View>

              {/* Categoría */}
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                Categoría
              </Text>
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

              {/* Botón guardar */}
              <Pressable
                onPress={handleSave}
                disabled={isSaving || isUploadingImage}
                style={{
                  backgroundColor: "#ff5722",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  opacity: isSaving || isUploadingImage ? 0.7 : 1,
                }}
              >
                {isSaving || isUploadingImage ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}
                  >
                    Guardar Cambios
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
