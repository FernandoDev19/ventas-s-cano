import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { Text, View } from "react-native";

type Props = {
  clients: any[];
  debtors: any[];
  totalDebt: number;
};

export default function ClientsHeader({ clients, debtors, totalDebt }: Props) {
  return (
    <View style={{ paddingTop: 16 }}>
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>
          Clientes
        </Text>
        <Text style={{ color: "#737373", fontSize: 14 }}>
          {clients.length} registrados · {debtors.length} con deuda
        </Text>
      </View>

      {/* Resumen deuda total */}
      {debtors.length > 0 && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 16,
            backgroundColor: "#1a1a1a",
            borderRadius: 16,
            borderLeftWidth: 4,
            borderLeftColor: "#f59e0b",
          }}
        >
          <Text
            style={{
              color: "#737373",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Total por cobrar
          </Text>
          <Text
            style={{
              color: "#f59e0b",
              fontSize: 32,
              fontWeight: "900",
              marginTop: 4,
            }}
          >
            {priceFormat(totalDebt)}
          </Text>
          <Text style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
            {debtors.length} cliente{debtors.length !== 1 ? "s" : ""} deben
          </Text>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          Lista de Clientes
        </Text>
      </View>
    </View>
  );
}
