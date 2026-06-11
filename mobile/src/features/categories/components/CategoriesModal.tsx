import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { CategoryType } from "../types/category.type";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/src/shared/components/ui/Button";
import { CategoriesService } from "../services/categories.service";

type Props = {
  visible: boolean;
  onSelect: (id: number) => void;
  onClose: () => void;
  onCreated: (id: number) => void;
};

const CategoriesModal = ({ visible, onClose, onCreated, onSelect }: Props) => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setName("");
  };

  useEffect(() => {
    fetchCategories();
  }, [visible]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const fetchCategories = async () => {
    const categories = await CategoriesService.getAll();
    setCategories(categories);
  };

  const handleDelete = async (categoryId: number) => {
    try {
      Alert.alert(
        "Eliminar categoría",
        "¿Estás seguro de que quieres eliminar esta categoría?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Eliminar",
            onPress: () => {
              CategoriesService.delete(categoryId);
              fetchCategories();
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert("Error", "No se pudo eliminar la categoría.");
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Falta descripción", "Por favor ingresa una descripción.");
      return;
    }

    setIsSaving(true);
    try {
      const category = await CategoriesService.create(name.trim());
      reset();
      onCreated(category.id);
    } catch (err) {
      Alert.alert("Error", "No se pudo crear la categoría.");
      console.error(err);
    } finally {
      setIsSaving(false);
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
              backgroundColor: "#141414",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              maxHeight: "60%",
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
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
                Seleccionar Categoría
              </Text>
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex flex-row gap-2 mb-6">
                {categories.map((cat) => {
                  return (
                    <View
                      key={cat.id}
                      className="flex flex-row gap-4 items-center justify-between rounded-full bg-red-500"
                    >
                      <Pressable
                        onPress={() => onSelect(cat.id)}
                        className="pl-4 h-10 justify-center"
                      >
                        <Text className="text-white text-sm font-semibold text-center">
                          {cat.name.split(" ")[0]}
                        </Text>
                      </Pressable>
                      <Pressable
                        className="border-l border-l-white pl-2 pr-4"
                        onPress={() => handleDelete(cat.id)}
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Name */}
            <Text
              style={{
                color: "#737373",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Crear nueva categoría
            </Text>
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 4,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "#2a2a2a",
              }}
            >
              <TextInput
                placeholder="Ej. Pollos"
                placeholderTextColor="#555"
                value={name}
                onChangeText={setName}
                style={{ color: "#fff", fontSize: 16, height: 46 }}
              />
            </View>

            {/* Botón guardar */}
            <Button
              title="Guardar"
              onPress={handleSave}
              disabled={isSaving || !name.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CategoriesModal;
