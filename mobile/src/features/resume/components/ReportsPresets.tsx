// @theme-migrated
import { Pressable, ScrollView, Text } from "react-native";
import { PRESETS } from "../hooks/useReports";
import { C } from "@/src/core/theme/palette";

type Props = {
  applyPreset: (preset: (typeof PRESETS)[0]) => void;
  activePreset: string;
};

export default function ReportsPresets({ applyPreset, activePreset }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 16,
      }}
    >
      {PRESETS.map((p) => (
        <Pressable
          key={p.label}
          onPress={() => applyPreset(p)}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: activePreset === p.label ? "#ff5722" : C.card,
            borderWidth: 1,
            borderColor: activePreset === p.label ? "#ff5722" : C.line2,
          }}
        >
          <Text
            style={{
              color: activePreset === p.label ? "#fff" : C.soft,
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            {p.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
