import { useEffect, useState } from "react";
import { CategoryType } from "../../categories/types/category.type";
import { ProductType } from "../types/product.type";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ProductsService } from "../services/products.service";
import { Ionicons } from "@expo/vector-icons";
import { useFiles } from "@/src/shared/hooks/useFiles";

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
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    try {
      await ProductsService.updateProduct(product.id, {
        name: name.trim(),
        price: parsedPrice,
        stock: parseInt(stock) || 0,
        category_id: categoryId,
        image_url: imageUri || "",
      });
      onUpdated();
    } catch (err) {
      Alert.alert("Error", "No se pudo actualizar el producto.");
      console.error(err);
    } finally {
      setIsSaving(false);
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
              await ProductsService.deleteProduct(product.id);
              onUpdated();
            } catch {
              Alert.alert("Error", "No se pudo eliminar el producto.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
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
              <Text style={{ color: "#ff5722", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
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

          {/* Selector de imagen */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Pressable
              onPress={handlePickImage}
              disabled={isPickingImage}
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
              {isPickingImage ? (
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
                    <Ionicons name="camera-outline" size={14} color="#fff" />
                  </View>
                </>
              ) : (
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Ionicons name="camera-outline" size={28} color="#555" />
                  <Text style={{ color: "#555", fontSize: 10 }}>Foto</Text>
                </View>
              )}
            </Pressable>
            {imageUri && (
              <Pressable
                onPress={() => setImageUri(null)}
                style={{ marginTop: 6 }}
              >
                <Text style={{ color: "#555", fontSize: 11 }}>Quitar imagen</Text>
              </Pressable>
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
                  style={{ color: "#fff", fontSize: 16, flex: 1, height: 46 }}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 24 }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {categories.map((cat) => {
                const isActive = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? "#ff5722" : "#1a1a1a",
                      borderWidth: 1,
                      borderColor: isActive ? "#ff5722" : "#333",
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? "#fff" : "#a3a3a3",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {cat.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Botón guardar */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: "#ff5722",
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
                Guardar Cambios
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
