import { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export default function ReasonDialog({
  visible,
  title,
  description,
  placeholder = "Escribe el motivo aquí...",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setReason("");
      setError(null);
    }
  }, [visible]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("El motivo es obligatorio");
      return;
    }
    if (trimmed.length < 4) {
      setError("El motivo debe tener al menos 4 caracteres");
      return;
    }
    setError(null);
    onConfirm(trimmed);
  };

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
              backgroundColor: "#1a1a1a",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#2e2e2e",
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {/* Header */}
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              {title}
            </Text>

            {description && (
              <Text
                style={{
                  color: "#a3a3a3",
                  fontSize: 13,
                  lineHeight: 18,
                  marginBottom: 16,
                }}
              >
                {description}
              </Text>
            )}

            {/* Input */}
            <TextInput
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                if (error) setError(null);
              }}
              placeholder={placeholder}
              placeholderTextColor="#555"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: "#0f0f0f",
                borderColor: error ? "#ef4444" : "#2e2e2e",
                borderWidth: 1,
                borderRadius: 14,
                padding: 12,
                color: "#fff",
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: "top",
                marginBottom: 8,
              }}
            />

            {error && (
              <Text
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  fontWeight: "600",
                  marginBottom: 16,
                  marginLeft: 4,
                }}
              >
                {error}
              </Text>
            )}

            {/* Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  backgroundColor: "#2a2a2a",
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {cancelText}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  backgroundColor: "#ff5722",
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {confirmText}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
