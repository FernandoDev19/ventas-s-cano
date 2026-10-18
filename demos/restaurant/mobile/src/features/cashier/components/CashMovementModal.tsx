import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { CashMovement } from "../types/shift.type";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (type: "entry" | "exit", description: string, amount: number, notes?: string) => Promise<CashMovement | undefined>;
};

export default function CashMovementModal({ visible, onClose, onAdd }: Props) {
  const [type, setType] = useState<"entry" | "exit">("exit");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    const parsed = parseFloat(amount.replace(/,/g, ""));
    if (!parsed || parsed <= 0) {
      alert("Monto inválido");
      return;
    }
    if (!description.trim()) {
      alert("Falta descripción");
      return;
    }

    setIsLoading(true);
    try {
      await onAdd(type, description, parsed, notes || undefined);
      setDescription("");
      setAmount("");
      setNotes("");
      setType("exit");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
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
          }}
        >
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 16 }}>
            Movimiento de Caja
          </Text>

          {/* Tipo */}
          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            Tipo
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <Pressable
              onPress={() => setType("exit")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: type === "exit" ? "#ef4444" : "#1a1a1a",
                borderWidth: 1,
                borderColor: type === "exit" ? "#ef4444" : "#2a2a2a",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: type === "exit" ? "#fff" : "#737373",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                ↓ Salida
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType("entry")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: type === "entry" ? "#22c55e" : "#1a1a1a",
                borderWidth: 1,
                borderColor: type === "entry" ? "#22c55e" : "#2a2a2a",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: type === "entry" ? "#fff" : "#737373",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                ↑ Entrada
              </Text>
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
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#2a2a2a",
            }}
          >
            <TextInput
              placeholder="Ej. Compra de hielo"
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              style={{ color: "#fff", fontSize: 14, height: 46 }}
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
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#2a2a2a",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ff5722", fontSize: 16, fontWeight: "800", marginRight: 4 }}>
              $
            </Text>
            <TextInput
              placeholder="0"
              placeholderTextColor="#555"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{ color: "#fff", fontSize: 14, flex: 1, height: 46 }}
            />
          </View>

          {/* Notas */}
          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Notas (opcional)
          </Text>
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              paddingHorizontal: 14,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#2a2a2a",
            }}
          >
            <TextInput
              placeholder="Detalles adicionales..."
              placeholderTextColor="#555"
              value={notes}
              onChangeText={setNotes}
              style={{ color: "#fff", fontSize: 14, height: 46 }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: "#2a2a2a",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: "#ff5722",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "800" }}>Registrar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}