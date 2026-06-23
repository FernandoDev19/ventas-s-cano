import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CashierShiftStatusType } from "../types/shift.type";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpen: (balance: number, notes?: string) => Promise<{
    id: string;
    opening_date: string;
    opening_time: string;
    opening_balance: number;
    status: CashierShiftStatusType;
    notes: string | undefined;
} | undefined>;
};

export default function OpenShiftModal({ visible, onClose, onOpen }: Props) {
  const [balance, setBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    const parsed = parseFloat(balance.replace(/,/g, ""));
    if (!parsed || parsed < 0) {
      Alert.alert("Monto inválido", "Ingresa un monto válido");
      return;
    }

    setIsLoading(true);
    try {
      await onOpen(parsed, notes || undefined);
      setBalance("");
      setNotes("");
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
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#141414",
            borderRadius: 24,
            padding: 24,
            width: "100%",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 16 }}>
            Abrir Turno
          </Text>

          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Base de Caja
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
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              style={{ color: "#fff", fontSize: 16, flex: 1, height: 46 }}
            />
          </View>

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
              placeholder="Ej. Efectivo + cheques"
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
              onPress={handleOpen}
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
                <Text style={{ color: "#fff", fontWeight: "800" }}>Abrir</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}