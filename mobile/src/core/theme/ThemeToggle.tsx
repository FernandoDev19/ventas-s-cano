import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeMode, useTheme } from "./ThemeContext";

const OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: "system", label: "Automático", icon: "phone-portrait-outline" },
  { mode: "light", label: "Claro", icon: "sunny-outline" },
  { mode: "dark", label: "Oscuro", icon: "moon-outline" },
];

/** Selector de apariencia. Úsalo en la pantalla "Más": <ThemeToggle /> */
export function ThemeToggle() {
  const { c, mode, setMode } = useTheme();
  return (
    <View style={{ backgroundColor: c.card, borderColor: c.line, borderWidth: 1, borderRadius: 16, padding: 6 }}>
      <Text style={{ color: c.soft, fontSize: 14, fontWeight: "600", marginHorizontal: 10, marginTop: 6, marginBottom: 8 }}>
        Apariencia
      </Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {OPTIONS.map((o) => {
          const active = mode === o.mode;
          return (
            <TouchableOpacity
              key={o.mode}
              onPress={() => setMode(o.mode)}
              activeOpacity={0.8}
              style={{
                flex: 1, minHeight: 56, borderRadius: 12, alignItems: "center", justifyContent: "center",
                backgroundColor: active ? "#ff5722" : c.line,
              }}
            >
              <Ionicons name={o.icon} size={20} color={active ? "#fff" : c.text} />
              <Text style={{ color: active ? "#fff" : c.text, fontSize: 14, fontWeight: "700", marginTop: 2 }}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
