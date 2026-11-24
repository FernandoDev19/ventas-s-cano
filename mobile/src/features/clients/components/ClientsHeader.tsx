// @theme-migrated
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { Text, View } from "react-native";
import { C } from "@/src/core/theme/palette";
import ExportButton from "@/src/shared/components/ui/ExportButton";
import { ExportDataService } from "@/src/shared/services/expor-data.service";

type Props = {
  clients: any[];
  debtors: any[];
  totalDebt: number;
};

export default function ClientsHeader({ clients, debtors, totalDebt }: Props) {
  return (
    <View style={{ paddingTop: 16 }}>
      <View className="px-4 mb-4 flex-row justify-between items-center">
        <View>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: "800" }}>
            Clientes
          </Text>
          <Text style={{ color: C.muted, fontSize: 16 }}>
            {clients.length} registrados · {debtors.length} con deuda
          </Text>
        </View>
        <ExportButton onExport={ExportDataService.clientsAndDebts} />
      </View>

      {/* Resumen deuda total */}
      {debtors.length > 0 && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 16,
            backgroundColor: C.card,
            borderRadius: 16,
            borderLeftWidth: 4,
            borderLeftColor: "#f59e0b",
          }}
        >
          <Text
            style={{
              color: C.muted,
              fontSize: 13,
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
          <Text style={{ color: C.faint, fontSize: 14, marginTop: 2 }}>
            {debtors.length} cliente{debtors.length !== 1 ? "s" : ""} deben
          </Text>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ color: C.text, fontWeight: "700", fontSize: 17 }}>
          Lista de Clientes
        </Text>
      </View>
    </View>
  );
}
