// @theme-migrated
import { useState } from "react";
import { CategoryType } from "../../categories/types/category.type";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { ProductsService } from "../services/products.service";
import { Ionicons } from "@expo/vector-icons";
import { useFiles } from "@/src/shared/hooks/useFiles";
import CategoriesModal from "../../categories/components/CategoriesModal";
import { SupabaseStorageService } from "@/src/shared/services/supabase-storage.service";
import { v4 as uuidv4 } from "uuid";
import { C } from "@/src/core/theme/palette";

type CreateProductModalProps = {
  visible: boolean;
  categories: CategoryType[];
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateProductModal({
  visible,
  categories,
  onClose,
  onCreated,
}: CreateProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isVisibleMenu, setIsVisibleMenu] = useState(true);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { elegirImagenProducto } = useFiles();

  const reset = () => {
    setName("");
    setPrice("");
    setStock("0");
    setCategoryId(null);
    setImageUri(null);
    setIsVisibleMenu(true);
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

  const handleSave = async () => {
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
    let imageUrl = "";

    try {
      // 1. Si hay imagen, subirla a Supabase
      if (imageUri) {
        setIsUploadingImage(true);
        const fileName = `product_${uuidv4()}.jpg`;
        const uploadedUrl = await SupabaseStorageService.uploadProductImage(
          imageUri,
          fileName,
        );

        if (!uploadedUrl) {
          Alert.alert(
            "Aviso",
            "El producto se guardó pero la imagen no se pudo subir. Intenta nuevamente desde edición.",
          );
          imageUrl = "";
        } else {
          imageUrl = uploadedUrl;
        }
        setIsUploadingImage(false);
      }

      // 2. Guardar el producto con la URL de la imagen
      await ProductsService.createProduct({
        name: name.trim(),
        price: parsedPrice,
        stock: parseInt(stock) || 0,
        category_id: categoryId,
        image_url: imageUrl,
        is_visible_menu: isVisibleMenu ? 1 : 0,
      });

      reset();
      onCreated();
      Alert.alert("Éxito", "Producto creado correctamente.");
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar el producto.");
      console.error(err);
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
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: C.sheet,
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
              <Text style={{ color: C.text, fontSize: 22, fontWeight: "800" }}>
                Nuevo Producto
              </Text>
              <Pressable
                onPress={handleClose}
                style={{
                  backgroundColor: C.line,
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={20} color={C.text} />
              </Pressable>
            </View>

            {/* Selector de imagen */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Pressable
                onPress={handlePickImage}
                disabled={isPickingImage || isUploadingImage}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 16,
                  backgroundColor: C.card,
                  borderWidth: 2,
                  borderColor: imageUri ? "#ff5722" : C.line,
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
                    style={{ width: 90, height: 90, borderRadius: 14 }}
                  />
                ) : (
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Ionicons name="camera-outline" size={28} color={C.faint} />
                    <Text style={{ color: C.faint, fontSize: 12 }}>Foto</Text>
                  </View>
                )}
              </Pressable>
              {imageUri && !isUploadingImage && (
                <Pressable
                  onPress={() => setImageUri(null)}
                  style={{ marginTop: 6 }}
                >
                  <Text style={{ color: C.faint, fontSize: 13 }}>
                    Quitar imagen
                  </Text>
                </Pressable>
              )}
              {isUploadingImage && (
                <Text style={{ color: "#ff5722", fontSize: 13, marginTop: 6 }}>
                  Subiendo imagen...
                </Text>
              )}
            </View>

            {/* Nombre */}
            <Text
              style={{
                color: C.muted,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Nombre
            </Text>
            <View
              style={{
                backgroundColor: C.card,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 4,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: C.line,
              }}
            >
              <TextInput
                placeholder="Ej. Pechuga de pollo"
                placeholderTextColor={C.faint}
                value={name}
                onChangeText={setName}
                style={{ color: C.text, fontSize: 18, height: 46 }}
              />
            </View>

            {/* Precio y Stock en fila */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  Precio
                </Text>
                <View
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: C.line,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#ff5722",
                      fontSize: 18,
                      fontWeight: "800",
                      marginRight: 4,
                    }}
                  >
                    $
                  </Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={C.faint}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    style={{ color: C.text, fontSize: 18, flex: 1, height: 46 }}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  Stock inicial
                </Text>
                <View
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: C.line,
                  }}
                >
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={C.faint}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                    style={{ color: C.text, fontSize: 18, height: 46 }}
                  />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  ¿Publicar en Menú Web?
                </Text>
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  Si lo apagas, el cliente no lo verá en la web pero podrás
                  seguir facturándolo en caja.
                </Text>
              </View>
              <Switch
                value={isVisibleMenu}
                onValueChange={setIsVisibleMenu}
                trackColor={{ false: C.line, true: "#ff572233" }}
                thumbColor={isVisibleMenu ? "#ff5722" : C.soft}
              />
            </View>

            {/* Categoría */}
            <Text
              style={{
                color: C.muted,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              Categoría
            </Text>
            <Pressable
              onPress={() => setIsCategoriesModalOpen(true)}
              className="h-16 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[#2a2a2a] rounded-2xl px-4 flex-row items-center gap-2 mb-6"
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
                  color={categoryId ? "#ff5722" : C.muted}
                />
                <Text
                  style={{
                    color: categoryId ? "#fff" : C.muted,
                    fontSize: 17,
                  }}
                >
                  {categoryId
                    ? categories.find((c) => c.id === categoryId)?.name
                    : "Selecciona una categoría"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={C.faint} />
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
                  style={{ color: "#fff", fontSize: 19, fontWeight: "800" }}
                >
                  Guardar Producto
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
