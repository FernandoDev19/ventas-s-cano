import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type Props = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string; // hex de 6 dígitos
};

export default function InfoChip({ label, icon, color = "#a3a3a3" }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: `${color}22`,
      }}
    >
      {icon && <Ionicons name={icon} size={12} color={color} />}
      <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}