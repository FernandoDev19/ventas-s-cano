import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type Props = {
  setModalVisible: (visible: boolean) => void;
  totalItems: number;
};

export default function CartHeader({ setModalVisible, totalItems }: Props) {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl font-black text-white">Mi Orden</Text>
        <Text className="text-primary font-bold text-lg">({totalItems})</Text>
      </View>

      <Pressable
        onPress={() => setModalVisible(false)}
        className="p-2 bg-neutral-800 rounded-full active:opacity-70"
      >
        <Ionicons name="close" size={24} color="white" />
      </Pressable>
    </View>
  );
}
