import { CategoryType } from "@/src/features/categories/types/category.type";
import ExpensesService from "../services/expense.service";
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
import { useState, useEffect } from "react";
import { getIcon } from "../helpers/getIcon";
import { SuppliersService } from "../../suppliers/services/suppliers.service";

type ExpenseDetailModalProps = {
  visible: boolean;
  expense: ExpenseType | null;
  category: CategoryType | null;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
};

const InfoRow = ({
  label,
  value,
  color = "#fff",
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
    <Text style={{ color: "#737373", fontSize: 12 }}>{label}</Text>
    <Text
      style={{
        color,
        fontSize: 13,
        fontWeight: "600",
        flexShrink: 1,
        textAlign: "right",
      }}
    >
      {value}
    </Text>
  </View>
);

export default function ExpenseDetailModal({
  visible,
  expense,
  category,
  onClose,
  onDeleted,
  onUpdated,
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
              Alert.alert(
                "Error",
                "No se pudo eliminar el gasto. \n" + (err as Error).message,
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const [items, setItems] = useState<any[]>([]);
  const [supplierName, setSupplierName] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !expense) return;
    ExpensesService.getItems(expense.id).then(setItems).catch(console.error);
    if (expense.supplier_id) {
      SuppliersService.getAll().then((l) =>
        setSupplierName(
          l.find((s) => s.id === expense.supplier_id)?.name ?? null,
        ),
      );
    } else {
      setSupplierName(null);
    }
  }, [visible, expense]);

  const handleMarkPaid = () =>
    Alert.alert("Marcar como pagado", "¿Ya le pagaste al proveedor?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, pagado",
        onPress: async () => {
          await ExpensesService.markAsPaid(expense!.id);
          onUpdated();
          onClose();
        },
      },
    ]);

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
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                Descripción
              </Text>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                {expense.description}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: "#2a2a2a" }} />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View>
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}
                >
                  Fecha
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}
                >
                  {formattedDate}
                </Text>
              </View>
              <View className="items-end">
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}
                >
                  Hora
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}
                >
                  {formattedTime}
                </Text>
              </View>
            </View>

            {(supplierName ||
              expense.invoice_number ||
              expense.payment_method ||
              expense.is_paid === 0) && (
              <>
                <View style={{ height: 1, backgroundColor: "#2a2a2a" }} />
                {supplierName && (
                  <InfoRow label="Proveedor" value={supplierName} />
                )}
                {expense.invoice_number && (
                  <InfoRow label="Factura" value={expense.invoice_number} />
                )}
                <InfoRow
                  label="Estado"
                  value={
                    expense.is_paid === 0
                      ? `Por pagar${expense.due_date ? ` · vence ${expense.due_date}` : ""}`
                      : `Pagado${expense.payment_method ? ` · ${expense.payment_method}` : ""}`
                  }
                  color={expense.is_paid === 0 ? "#f59e0b" : "#22c55e"}
                />
              </>
            )}
          </View>

          {items.length > 0 && (
            <>
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Ítems de la compra
              </Text>
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                  marginBottom: 16,
                  gap: 8,
                }}
              >
                {items.map((it) => (
                  <View
                    key={it.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 13, flex: 1 }}
                      numberOfLines={1}
                    >
                      {it.quantity}× {it.name}
                      {it.add_to_stock ? " 📦" : ""}
                    </Text>
                    <Text style={{ color: "#a3a3a3", fontSize: 13 }}>
                      {priceFormat(it.quantity * it.unit_cost)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {expense.is_paid === 0 && (
            <Pressable
              onPress={handleMarkPaid}
              style={{
                backgroundColor: "#22c55e",
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                Marcar como pagado
              </Text>
            </Pressable>
          )}

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
