import { Text, View } from "react-native";

export default function ReportsHeader() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 16 }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>
        Reportes
      </Text>
      <Text style={{ color: "#737373", fontSize: 14 }}>
        Por rango de fechas
      </Text>
    </View>
  );
}
