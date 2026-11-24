// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SupplierType } from "../types/supplier.type";
import { C } from "@/src/core/theme/palette";

type Props = {
  suppliers: SupplierType[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function SupplierPicker({
  suppliers,
  selectedId,
  onSelect,
}: Props) {
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
        Proveedor (opcional)
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {[{ id: null, name: "Ninguno" } as const, ...suppliers].map((s) => {
          const active = selectedId === s.id;
          return (
            <Pressable
              key={s.id ?? "none"}
              onPress={() => onSelect(s.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: active ? "#ff5722" : C.card,
                borderWidth: 1,
                borderColor: active ? "#ff5722" : C.line2,
              }}
            >
              {s.id && (
                <Ionicons
                  name="storefront-outline"
                  size={14}
                  color={active ? "#fff" : C.soft}
                />
              )}
              <Text
                style={{
                  color: active ? "#fff" : C.soft,
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                {s.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
