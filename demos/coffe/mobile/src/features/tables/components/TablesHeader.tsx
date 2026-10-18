import { Text, View } from "react-native";
import { TableType } from "../services/tables.service";

type Props = {
  tables: TableType[];
};

export default function TablesHeader({ tables }: Props) {
  const stats = {
    total: tables.length,
    libres: tables.filter((t) => t.status === "libre").length,
    ocupadas: tables.filter((t) => t.status === "ocupada").length,
  };

  const StatBox = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <View
      style={{
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: color,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "900", color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: "#737373", marginTop: 2, textAlign: "center" }}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
      {/* Título */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>
          Mesas
        </Text>
        <Text style={{ fontSize: 13, color: "#737373", marginTop: 2 }}>
          {stats.total} total · {stats.ocupadas} ocupadas
        </Text>
      </View>

      {/* Grid de Estadísticas */}
      <View style={{ gap: 8 }}>
        {/* Fila 1 */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <StatBox label="Libres" value={stats.libres} color="#22c55e" />
          <StatBox label="Ocupadas" value={stats.ocupadas} color="#3b82f6" />
          <StatBox label="Total" value={stats.total} color="#ff5722" />
        </View>
      </View>

      {/* Instrucciones */}
      <View
        style={{
          marginTop: 16,
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: "#1a1a1a",
          borderRadius: 12,
          borderLeftWidth: 3,
          borderLeftColor: "#ff5722",
        }}
      >
        <Text style={{ fontSize: 12, color: "#a3a3a3", lineHeight: 16 }}>
          💡 Toca una mesa para cambiar su estado. Los clientes pueden pedir desde sus QR también.
        </Text>
      </View>
    </View>
  );
}