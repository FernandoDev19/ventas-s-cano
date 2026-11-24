// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import {
  parseLocalDate,
  toLocalDateStr,
} from "@/src/shared/helpers/date.helper";
import { C } from "@/src/core/theme/palette";

type Props = {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
};

export default function DateField({ label, value, onChange }: Props) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          color: C.muted,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={() => setShow(true)}
        style={{
          height: 48,
          backgroundColor: C.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.line,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: value ? "#fff" : C.faint,
            fontSize: 17,
            fontWeight: "600",
          }}
        >
          {value
            ? parseLocalDate(value).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Seleccionar fecha"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#ff5722" />
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ? parseLocalDate(value) : new Date()}
          mode="date"
          onChange={(_, d) => {
            setShow(Platform.OS === "ios");
            if (d) onChange(toLocalDateStr(d));
          }}
        />
      )}
    </View>
  );
}
