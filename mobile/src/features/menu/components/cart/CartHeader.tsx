import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";

type Props = {
  setModalVisible: (visible: boolean) => void;
  totalItems: number;
  onClearOrder?: () => void;
};

export default function CartHeader({
  setModalVisible,
  totalItems,
  onClearOrder,
}: Props) {
  const handleClear = () => {
    Alert.alert(
      "Vaciar carrito",
      "¿Seguro que deseas eliminar todos los productos de esta orden?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Vaciar",
          style: "destructive",
          onPress: () => onClearOrder?.(),
        },
      ],
    );
  };

  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl font-black text-white">Mi Orden</Text>
        <Text className="text-primary font-bold text-lg">({totalItems})</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {onClearOrder && totalItems > 0 && (
          <Pressable
            onPress={handleClear}
            className="p-2 bg-neutral-800 rounded-full active:opacity-70"
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </Pressable>
        )}
        <Pressable
          onPress={() => setModalVisible(false)}
          className="p-2 bg-neutral-800 rounded-full active:opacity-70"
          hitSlop={8}
        >
          <Ionicons name="close" size={22} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
