// @theme-migrated
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
import { C } from "@/src/core/theme/palette";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpen: (
    balance: number,
    notes?: string,
  ) => Promise<
    | {
        id: string;
        opening_date: string;
        opening_time: string;
        opening_balance: number;
        status: CashierShiftStatusType;
        notes: string | undefined;
      }
    | undefined
  >;
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
            backgroundColor: C.sheet,
            borderRadius: 24,
            padding: 24,
            width: "100%",
          }}
        >
          <Text
            style={{
              color: C.text,
              fontSize: 22,
              fontWeight: "800",
              marginBottom: 16,
            }}
          >
            Abrir Turno
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
            Base de Caja
          </Text>
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              paddingHorizontal: 14,
              marginBottom: 16,
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
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              style={{ color: C.text, fontSize: 18, flex: 1, height: 46 }}
            />
          </View>

          <Text
            style={{
              color: C.muted,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Notas (opcional)
          </Text>
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              paddingHorizontal: 14,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: C.line,
            }}
          >
            <TextInput
              placeholder="Ej. Efectivo + cheques"
              placeholderTextColor={C.faint}
              value={notes}
              onChangeText={setNotes}
              style={{ color: C.text, fontSize: 16, height: 46 }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: C.line,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <Text style={{ color: C.text, fontWeight: "700" }}>Cancelar</Text>
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
