// @theme-migrated
import { Text, View } from "react-native";
import { C } from "@/src/core/theme/palette";

export default function ReportsHeader() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 16 }}>
      <Text style={{ color: C.text, fontSize: 24, fontWeight: "800" }}>
        Reportes
      </Text>
      <Text style={{ color: C.muted, fontSize: 16 }}>Por rango de fechas</Text>
    </View>
  );
}
