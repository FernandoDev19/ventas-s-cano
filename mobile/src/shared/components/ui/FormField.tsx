// @theme-migrated
import { Text, TextInput, TextInputProps, View } from "react-native";
import { C } from "@/src/core/theme/palette";

type Props = TextInputProps & { label: string; prefix?: string };

export default function FormField({ label, prefix, style, ...rest }: Props) {
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
      <View
        style={{
          backgroundColor: C.card,
          borderRadius: 12,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: C.line,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {!!prefix && (
          <Text
            style={{
              color: "#ff5722",
              fontSize: 18,
              fontWeight: "800",
              marginRight: 6,
            }}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          placeholderTextColor={C.faint}
          style={[{ flex: 1, color: C.text, fontSize: 18, height: 46 }, style]}
          {...rest}
        />
      </View>
    </View>
  );
}
