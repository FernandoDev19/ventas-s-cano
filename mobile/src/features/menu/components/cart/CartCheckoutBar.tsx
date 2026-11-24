// @theme-migrated
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { C } from "@/src/core/theme/palette";

type Props = {
  total: number;
  itemsCount: number;
  summary: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
};

export default function CartCheckoutBar({
  total,
  itemsCount,
  summary,
  isSubmitting,
  onConfirm,
}: Props) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: C.line,
        paddingTop: 12,
        paddingBottom: 28,
        backgroundColor: C.card,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              color: C.muted,
              fontSize: 13,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            Total · {itemsCount} ítem{itemsCount !== 1 ? "s" : ""}
          </Text>
          <Text style={{ color: C.soft, fontSize: 14 }} numberOfLines={1}>
            {summary}
          </Text>
        </View>
        <Text style={{ color: C.text, fontSize: 28, fontWeight: "900" }}>
          {priceFormat(total)}
        </Text>
      </View>

      <Pressable
        onPress={onConfirm}
        disabled={isSubmitting}
        style={{
          backgroundColor: "#ff5722",
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: "center",
          opacity: isSubmitting ? 0.6 : 1,
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>
            Confirmar Pedido
          </Text>
        )}
      </Pressable>
    </View>
  );
}
