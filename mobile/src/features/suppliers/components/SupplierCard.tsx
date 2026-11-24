// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View } from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { SupplierType } from "../types/supplier.type";
import { C } from "@/src/core/theme/palette";

type Props = {
  supplier: SupplierType;
  payable: number;
  onPress: () => void;
  onLongPress: () => void;
};

export default function SupplierCard({
  supplier,
  payable,
  onPress,
  onLongPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 14,
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: payable > 0 ? "#f59e0b33" : C.line,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: "#ff572222",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="storefront-outline" size={22} color="#ff5722" />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{ color: C.text, fontWeight: "700", fontSize: 17 }}
          numberOfLines={1}
        >
          {supplier.name}
        </Text>
        {!!supplier.products_supplied && (
          <Text style={{ color: C.soft, fontSize: 14 }} numberOfLines={1}>
            {supplier.products_supplied}
          </Text>
        )}
        <Text style={{ color: C.faint, fontSize: 13, marginTop: 2 }}>
          {supplier.contact_name ? `${supplier.contact_name} · ` : ""}
          {supplier.payment_terms_days
            ? `Crédito ${supplier.payment_terms_days} días`
            : "Contado"}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: 6 }}>
        {payable > 0 && (
          <View
            style={{
              backgroundColor: "#f59e0b22",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "800" }}>
              Debes {priceFormat(payable)}
            </Text>
          </View>
        )}
        {!!supplier.phone && (
          <Pressable
            hitSlop={8}
            onPress={() => Linking.openURL(`tel:${supplier.phone}`)}
            style={{
              backgroundColor: "#22c55e22",
              borderRadius: 16,
              padding: 7,
            }}
          >
            <Ionicons name="call-outline" size={16} color="#22c55e" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
