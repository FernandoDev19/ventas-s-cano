import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { Pressable, Text, View } from "react-native";

type Props = {
  item: any;
  openEdit: (client: any) => void;
  handleDelete: (client: any) => void;
};

export default function ClientCard({ item, openEdit, handleDelete }: Props) {
  return (
    <Pressable
      onPress={() => openEdit(item)}
      onLongPress={() => handleDelete(item)}
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 14,
        backgroundColor: "#1a1a1a",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: item.totalDebt > 0 ? "#f59e0b33" : "#2a2a2a",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: item.totalDebt > 0 ? "#f59e0b22" : "#ff572222",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: item.totalDebt > 0 ? "#f59e0b" : "#ff5722",
            fontWeight: "900",
            fontSize: 18,
          }}
        >
          {item.name[0].toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          {item.name}
        </Text>
        {item.phone ? (
          <Text style={{ color: "#737373", fontSize: 12 }}>{item.phone}</Text>
        ) : null}
        {item.email ? (
          <Text style={{ color: "#737373", fontSize: 12 }}>{item.email}</Text>
        ) : null}
        {item.salesCount > 0 && (
          <Text style={{ color: "#555", fontSize: 11, marginTop: 2 }}>
            {item.salesCount} venta{item.salesCount !== 1 ? "s" : ""} fiada
            {item.salesCount !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Deuda */}
      {item.totalDebt > 0 && (
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#f59e0b", fontWeight: "800", fontSize: 16 }}>
            {priceFormat(item.totalDebt)}
          </Text>
          <Text style={{ color: "#f59e0b", fontSize: 10, opacity: 0.7 }}>
            por cobrar
          </Text>
        </View>
      )}
    </Pressable>
  );
}
