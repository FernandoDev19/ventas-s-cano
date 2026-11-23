import { Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & { label: string; prefix?: string };

export default function FormField({ label, prefix, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{
        backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 14,
        borderWidth: 1, borderColor: "#2a2a2a", flexDirection: "row", alignItems: "center",
      }}>
        {!!prefix && <Text style={{ color: "#ff5722", fontSize: 16, fontWeight: "800", marginRight: 6 }}>{prefix}</Text>}
        <TextInput placeholderTextColor="#555" style={[{ flex: 1, color: "#fff", fontSize: 16, height: 46 }, style]} {...rest} />
      </View>
    </View>
  );
}