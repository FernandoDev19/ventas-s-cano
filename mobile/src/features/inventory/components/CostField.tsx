import { Text, TextInput, View } from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { C } from "@/src/core/theme/palette";

const num = (s: string) => parseFloat(s.replace(/,/g, "")) || 0;

export default function CostField({
  price, cost, onChangeCost,
}: { price: string; cost: string; onChangeCost: (v: string) => void }) {
  const p = num(price), c = num(cost);
  const profit = p - c;
  const margin = p > 0 ? (profit / p) * 100 : 0;
  const color = profit < 0 ? "#ef4444" : margin < 20 ? "#f59e0b" : "#22c55e";

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: C.muted, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Costo de compra (por unidad)
      </Text>
      <View style={{ backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1,
                     borderColor: C.line, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: "#ff5722", fontSize: 18, fontWeight: "800", marginRight: 4 }}>$</Text>
        <TextInput value={cost} onChangeText={onChangeCost} keyboardType="numeric" placeholder="0"
          placeholderTextColor={C.faint} style={{ color: C.text, fontSize: 18, flex: 1, height: 46 }} />
      </View>
      {c > 0 && p > 0 && (
        <Text style={{ color, fontSize: 14, fontWeight: "700", marginTop: 6 }}>
          Ganas {priceFormat(profit)} por unidad · margen {margin.toFixed(0)}%
        </Text>
      )}
    </View>
  );
}