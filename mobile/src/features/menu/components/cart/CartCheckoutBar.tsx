import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";

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
        borderTopColor: "#262626",
        paddingTop: 12,
        paddingBottom: 28,
        backgroundColor: "#171717",
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
          <Text style={{ color: "#737373", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
            Total · {itemsCount} ítem{itemsCount !== 1 ? "s" : ""}
          </Text>
          <Text style={{ color: "#a3a3a3", fontSize: 12 }} numberOfLines={1}>
            {summary}
          </Text>
        </View>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900" }}>
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
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>
            Confirmar Pedido
          </Text>
        )}
      </Pressable>
    </View>
  );
}