// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import ExpensesService from "../services/expense.service";
import { CategoriesService } from "../../categories/services/categories.service";
import { CategoryType } from "../../categories/types/category.type";
import { getIcon } from "../helpers/getIcon";
import { C } from "@/src/core/theme/palette";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

/** Gasto en 2 toques: monto + categoría. La descripción es opcional. */
export default function QuickExpenseModal({
  visible,
  onClose,
  onSaved,
}: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmount("");
    setDescription("");
    setCategoryId(null);
    CategoriesService.getAll().then(setCategories).catch(console.error);
  }, [visible]);

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      Alert.alert("Monto inválido", "Ingresa el monto del gasto.");
      return;
    }
    const cat = categories.find((c) => c.id === categoryId);
    setIsSaving(true);
    try {
      await ExpensesService.createExpense({
        description: description.trim() || cat?.name || "Gasto rápido",
        amount: parsed,
        category_id: categoryId,
        date: new Date(),
        notes: "",
      });
      onSaved?.();
      onClose();
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar el gasto.");
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
      onRequestClose={onClose}
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
              paddingBottom: 32,
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
              <Text style={{ color: C.text, fontSize: 22, fontWeight: "800" }}>
                Gasto rápido
              </Text>
              <Pressable
                onPress={onClose}
                style={{
                  backgroundColor: C.line,
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={20} color={C.text} />
              </Pressable>
            </View>

            {/* Monto grande */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: amount ? "#ff5722" : C.line,
                paddingHorizontal: 16,
                marginBottom: 10,
              }}
            >
              <Text
                style={{ color: "#ff5722", fontSize: 28, fontWeight: "900" }}
              >
                $
              </Text>
              <TextInput
                autoFocus
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={C.faint}
                value={amount}
                onChangeText={setAmount}
                style={{
                  flex: 1,
                  color: C.text,
                  fontSize: 32,
                  fontWeight: "900",
                  height: 64,
                  marginLeft: 8,
                }}
              />
            </View>

            {/* Montos rápidos */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {QUICK_AMOUNTS.map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setAmount(String(v))}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: C.line,
                  }}
                >
                  <Text
                    style={{ color: C.soft, fontWeight: "700", fontSize: 14 }}
                  >
                    {v / 1000}k
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Categorías */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 16 }}
            >
              {categories.map((cat) => {
                const active = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(active ? null : cat.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: active ? "#ff5722" : C.card,
                      borderWidth: 1,
                      borderColor: active ? "#ff5722" : C.line2,
                    }}
                  >
                    <Ionicons
                      name={getIcon(cat.name)}
                      size={14}
                      color={active ? "#fff" : C.soft}
                    />
                    <Text
                      style={{
                        color: active ? "#fff" : C.soft,
                        fontWeight: "600",
                        fontSize: 15,
                      }}
                    >
                      {cat.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <TextInput
              placeholder="Descripción (opcional)"
              placeholderTextColor={C.faint}
              value={description}
              onChangeText={setDescription}
              style={{
                backgroundColor: C.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.line,
                color: C.text,
                paddingHorizontal: 14,
                height: 46,
                marginBottom: 16,
              }}
            />

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
                <Text
                  style={{ color: "#fff", fontSize: 19, fontWeight: "800" }}
                >
                  Guardar gasto
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
