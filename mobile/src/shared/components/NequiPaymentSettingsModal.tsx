import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSettings } from "@/src/core/context/SettingsContext";
import { useTheme } from "@/src/core/theme/ThemeContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NequiPaymentSettingsModal({
  visible,
  onClose,
}: Props) {
  const { c } = useTheme();
  const { nequiPaymentInfo, setNequiPaymentInfo } = useSettings();
  const [paymentInfo, setPaymentInfo] = useState(nequiPaymentInfo);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setPaymentInfo(nequiPaymentInfo);
  }, [nequiPaymentInfo, visible]);

  const save = async () => {
    setSaving(true);
    try {
      await setNequiPaymentInfo(paymentInfo);
      Alert.alert("Guardado", "Se actualizaron los datos de pago Nequi.");
      onClose();
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudieron guardar los datos de pago: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
          backgroundColor: "#0009",
        }}
      >
        <View
          style={{
            padding: 20,
            borderRadius: 18,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.line,
          }}
        >
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "800" }}>
            Datos de pago Nequi
          </Text>
          <Text style={{ color: c.muted, fontSize: 14, marginTop: 8 }}>
            Ingresa la llave Nequi/Bre-B o un enlace público al QR. Se incluirá
            en el mensaje de WhatsApp cuando el pedido indique pago por Nequi.
          </Text>
          <TextInput
            value={paymentInfo}
            onChangeText={setPaymentInfo}
            placeholder="Llave Nequi o URL pública del QR"
            placeholderTextColor={c.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              marginTop: 16,
              minHeight: 48,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.line,
              color: c.text,
              backgroundColor: c.bg,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 18,
            }}
          >
            <Pressable onPress={onClose} disabled={saving} style={{ padding: 10 }}>
              <Text style={{ color: c.muted, fontWeight: "700" }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: "#ff5722",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {saving ? "Guardando..." : "Guardar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
