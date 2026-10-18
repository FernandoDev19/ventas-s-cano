import { Pressable, ScrollView, Text } from "react-native";
import { PRESETS } from "../hooks/useReports";

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
            backgroundColor: activePreset === p.label ? "#ff5722" : "#1a1a1a",
            borderWidth: 1,
            borderColor: activePreset === p.label ? "#ff5722" : "#333",
          }}
        >
          <Text
            style={{
              color: activePreset === p.label ? "#fff" : "#a3a3a3",
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            {p.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
