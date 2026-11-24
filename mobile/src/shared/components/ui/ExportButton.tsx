import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text } from "react-native";

type Props = { onExport: () => Promise<void>; label?: string };

export default function ExportButton({ onExport, label = "Exportar" }: Props) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await onExport();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo exportar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={run}
      disabled={busy}
      style={{
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "#22c55e15", borderWidth: 1, borderColor: "#22c55e33",
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#22c55e" />
      ) : (
        <Ionicons name="download-outline" size={16} color="#22c55e" />
      )}
      <Text style={{ color: "#22c55e", fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}