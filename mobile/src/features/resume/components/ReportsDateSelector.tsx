// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { formatDate } from "../helpers/formatDate";
import { C } from "@/src/core/theme/palette";

type Props = {
  startDate: string;
  endDate: string;
  setShowStartPicker: (show: boolean) => void;
  setShowEndPicker: (show: boolean) => void;
  applyCustom: () => void;
};

export default function ReportsDateSelector({
  startDate,
  endDate,
  setShowStartPicker,
  setShowEndPicker,
  applyCustom,
}: Props) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.line,
      }}
    >
      <Text
        style={{
          color: C.muted,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 12,
        }}
      >
        Rango personalizado
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        {/* Fecha inicio */}
        <Pressable
          onPress={() => setShowStartPicker(true)}
          style={{
            flex: 1,
            backgroundColor: C.line,
            borderRadius: 10,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="calendar-outline" size={16} color="#ff5722" />
          <View>
            <Text style={{ color: C.muted, fontSize: 12 }}>Desde</Text>
            <Text style={{ color: C.text, fontWeight: "600", fontSize: 15 }}>
              {formatDate(startDate)}
            </Text>
          </View>
        </Pressable>

        {/* Fecha fin */}
        <Pressable
          onPress={() => setShowEndPicker(true)}
          style={{
            flex: 1,
            backgroundColor: C.line,
            borderRadius: 10,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="calendar-outline" size={16} color="#ff5722" />
          <View>
            <Text style={{ color: C.muted, fontSize: 12 }}>Hasta</Text>
            <Text style={{ color: C.text, fontWeight: "600", fontSize: 15 }}>
              {formatDate(endDate)}
            </Text>
          </View>
        </Pressable>
      </View>

      <Pressable
        onPress={applyCustom}
        style={{
          backgroundColor: "#ff5722",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>
          Generar Reporte
        </Text>
      </Pressable>
    </View>
  );
}
