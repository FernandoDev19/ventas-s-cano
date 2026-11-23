import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, Text, View,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function SheetModal({ visible, title, eyebrow, onClose, children }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: "#141414", borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 24, paddingBottom: 32, maxHeight: "92%",
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                {!!eyebrow && (
                  <Text style={{ color: "#ff5722", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                    {eyebrow}
                  </Text>
                )}
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }} numberOfLines={1}>{title}</Text>
              </View>
              <Pressable onPress={onClose} style={{ backgroundColor: "#2a2a2a", borderRadius: 20, padding: 8 }}>
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetButton({
  label, onPress, loading, color = "#ff5722",
}: { label: string; onPress: () => void; loading?: boolean; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={{
        backgroundColor: color, paddingVertical: 16, borderRadius: 16,
        alignItems: "center", opacity: loading ? 0.7 : 1, marginTop: 8, marginBottom: 8,
      }}
    >
      {loading ? <ActivityIndicator color="#fff" /> : (
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>{label}</Text>
      )}
    </Pressable>
  );
}