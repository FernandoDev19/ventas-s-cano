import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import ExpensesService from "../services/expense.service";
import { CategoryType } from "../../categories/types/category.type";
import CategoriesModal from "../../categories/components/CategoriesModal";

type Props = {
  visible: boolean;
  categories: CategoryType[];
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateExpenseModal({
  visible,
  categories,
  onClose,
  onCreated,
}: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const reset = () => {
    setDescription("");
    setAmount("");
    setCategoryId(null);
    setNotes("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert("Falta descripción", "Por favor ingresa una descripción.");
      return;
    }
    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Monto inválido", "Por favor ingresa un monto mayor a 0.");
      return;
    }
    if (!categoryId) {
      Alert.alert("Falta categoría", "Por favor selecciona una categoría.");
      return;
    }
 
    setIsSaving(true);
    try {
      await ExpensesService.createExpense({
        description: description.trim(),
        amount: parsedAmount,
        category_id: categoryId,
        date: new Date(),
        notes: notes.trim(),
      });
      reset();
      onCreated();
      Alert.alert("Gasto registrado", "El gasto se registró correctamente.");
    } catch (err) {
      console.error("❌ Error creando gasto:", err);
      const errorMessage = err instanceof Error ? err.message : "Desconocido";
      Alert.alert(
        "❌ Error al guardar",
        `No se pudo registrar el gasto.\n\nDetalles: ${errorMessage}`,
        [{ text: "Reintentar", onPress: () => setIsSaving(false) }]
      );
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
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
              Nuevo Gasto
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

          {/* Descripción */}
          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Descripción
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
              placeholder="Ej. Compra de pollos"
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              style={{ color: "#fff", fontSize: 16, height: 46 }}
            />
          </View>

          {/* Monto */}
          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Monto
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
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#ff5722",
                fontSize: 18,
                fontWeight: "800",
                marginRight: 6,
              }}
            >
              $
            </Text>
            <TextInput
              placeholder="0"
              placeholderTextColor="#555"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{ color: "#fff", fontSize: 16, flex: 1, height: 46 }}
            />
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

          {/* Notas (opcional) */}
          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Notas <Text style={{ color: "#444" }}>(opcional)</Text>
          </Text>
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 4,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#2a2a2a",
            }}
          >
            <TextInput
              placeholder="Ej. Proveedor, factura..."
              placeholderTextColor="#555"
              value={notes}
              onChangeText={setNotes}
              style={{ color: "#fff", fontSize: 15, height: 46 }}
            />
          </View>

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
                Guardar Gasto
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
