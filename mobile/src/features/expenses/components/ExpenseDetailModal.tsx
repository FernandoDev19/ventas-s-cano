import { CategoryType } from "@/src/features/categories/types/category.type";
import { ExpensesService } from "../services/expense.service";
import { ExpenseType } from "../types/expense.type";
import { Ionicons } from "@expo/vector-icons";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useState } from "react";

type ExpenseDetailModalProps = {
  visible: boolean;
  expense: ExpenseType | null;
  category: CategoryType | null;
  onClose: () => void;
  onDeleted: () => void;
};

const EXPENSE_ICONS: Record<string, any> = {
  "Pollos": "fast-food-outline",
  "Cerdo & Picadas": "nutrition-outline",
  "Embutidos (Buti/Chorizo)": "restaurant-outline",
  "Bebidas": "water-outline",
  "Cervezas / Alcohol": "beer-outline",
};

function getIcon(categoryName: string): any {
  return EXPENSE_ICONS[categoryName] ?? "pricetag-outline";
}

export default function ExpenseDetailModal({
  visible,
  expense,
  category,
  onClose,
  onDeleted,
}: ExpenseDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (!expense) return;
    Alert.alert(
      "Eliminar gasto",
      `¿Seguro que deseas eliminar el gasto "${expense.description}" de ${priceFormat(expense.amount)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await ExpensesService.deleteExpense(expense.id);
              onDeleted();
              onClose();
            } catch (err) {
              Alert.alert("Error", "No se pudo eliminar el gasto.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!expense) return null;

  const formattedDate = new Date(expense.date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedTime = new Date(expense.date).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
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
                Detalle de Gasto
              </Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
                Gasto Registrado
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={handleDelete}
                disabled={isDeleting}
                style={{
                  backgroundColor: "#2a0a0a",
                  borderRadius: 20,
                  padding: 10,
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
              <Pressable
                onPress={onClose}
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 20,
                  padding: 10,
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Icono + Categoria + Monto */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                backgroundColor: "#ff572222",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons
                name={getIcon(category?.name ?? "")}
                size={32}
                color="#ff5722"
              />
            </View>
            <Text style={{ color: "#a3a3a3", fontSize: 14, fontWeight: "600" }}>
              {category?.name ?? "Sin Categoría"}
            </Text>
            <Text
              style={{
                color: "#ff5722",
                fontSize: 32,
                fontWeight: "900",
                marginTop: 6,
              }}
            >
              -{priceFormat(expense.amount)}
            </Text>
          </View>

          {/* Información */}
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#2a2a2a",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <View>
              <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                Descripción
              </Text>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                {expense.description}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: "#2a2a2a" }} />

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                  Fecha
                </Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                  {formattedDate}
                </Text>
              </View>
              <View style={{ alignItems: "end" }}>
                <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                  Hora
                </Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                  {formattedTime}
                </Text>
              </View>
            </View>
          </View>

          {/* Notas */}
          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Notas
          </Text>
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#2a2a2a",
            }}
          >
            <Text
              style={{
                color: expense.notes ? "#fff" : "#555",
                fontSize: 14,
                fontStyle: expense.notes ? "normal" : "italic",
              }}
            >
              {expense.notes || "Sin notas descriptivas"}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
