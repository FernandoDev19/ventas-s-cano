import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { C } from "@/src/core/theme/palette";

type Props = {
  visible: boolean;
  title: string;
  originalPrice: number;
  currentPrice: number;
  originalLabel?: string;
  onClose: () => void;
  onConfirm: (price: number) => void;
  onReset?: () => void;
};

export default function PriceDialog({
  visible,
  title,
  originalPrice,
  currentPrice,
  originalLabel = "Precio original",
  onClose,
  onConfirm,
  onReset,
}: Props) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (visible) setValue(String(currentPrice));
  }, [visible, currentPrice]);

  const parsed = Number(value.replace(/[^0-9]/g, ""));
  const valid = value.trim() !== "";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Pressable
            style={{
              width: "100%",
              maxWidth: 400,
              backgroundColor: C.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: C.line,
              padding: 24,
            }}
          >
            <Text
              style={{ color: C.text, fontSize: 20, fontWeight: "800" }}
              numberOfLines={2}
            >
              {title}
            </Text>
            <Text
              style={{
                color: C.muted,
                fontSize: 14,
                marginTop: 4,
                marginBottom: 16,
              }}
            >
              {originalLabel}: {priceFormat(originalPrice)}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.bg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: valid ? "#ff5722" : C.line,
                paddingHorizontal: 14,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: "#ff5722",
                  fontSize: 24,
                  fontWeight: "900",
                  marginRight: 6,
                }}
              >
                $
              </Text>
              <TextInput
                autoFocus
                keyboardType="numeric"
                value={value}
                onChangeText={setValue}
                placeholder="0"
                placeholderTextColor={C.faint}
                style={{
                  flex: 1,
                  color: C.text,
                  fontSize: 26,
                  fontWeight: "800",
                  height: 56,
                }}
              />
            </View>

            {!!onReset && currentPrice !== originalPrice && (
              <Pressable
                onPress={onReset}
                style={{
                  alignItems: "center",
                  paddingVertical: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: C.soft, fontWeight: "700" }}>
                  Restaurar precio original
                </Text>
              </Pressable>
            )}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  backgroundColor: C.line,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: C.text, fontWeight: "700" }}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                disabled={!valid}
                onPress={() => onConfirm(parsed)}
                style={{
                  flex: 1,
                  backgroundColor: "#ff5722",
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  opacity: valid ? 1 : 0.5,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  Guardar
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
