import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TableType } from "../services/tables.service";

type Props = {
  table: TableType;
};

export default function TableCard({ table }: Props) {
  const getStatusColor = () => {
    switch (table.status) {
      case "libre":
        return { bg: "#22c55e22", border: "#22c55e", text: "#22c55e", icon: "checkmark-circle" };
      case "ocupada":
        return { bg: "#3b82f622", border: "#3b82f6", text: "#3b82f6", icon: "people" };
      case "esperando_cuenta":
        return { bg: "#f59e0b22", border: "#f59e0b", text: "#f59e0b", icon: "document-text" };
      case "por_cobrar":
        return { bg: "#f43f5e22", border: "#f43f5e", text: "#f43f5e", icon: "wallet" };
      default:
        return { bg: "#64748b22", border: "#64748b", text: "#64748b", icon: "help-circle" };
    }
  };

  const status = getStatusColor();
  const statusLabel = {
    libre: "Libre",
    ocupada: "Ocupada",
    esperando_cuenta: "Cuenta",
    por_cobrar: "Por Cobrar",
  }[table.status];

  return (
    <View
      style={{
        flex: 1,
        minWidth: 100,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: status.bg,
        borderWidth: 2,
        borderColor: status.border,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {/* Número de Mesa */}
      <Text style={{ fontSize: 24, fontWeight: "900", color: "#fff" }}>
        {table.number_mesa}
      </Text>

      {/* Icono de Estado */}
      <Ionicons name={status.icon as any} size={24} color={status.text} />

      {/* Label de Estado */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: status.text,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {statusLabel}
      </Text>
    </View>
  );
}