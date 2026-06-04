import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

export default function Header() {
    const router = useRouter();

    const handlePress = () => {
        router.push("/");
    };

    return (
        <SafeAreaView className="bg-background shadow-md" edges={["top", "left", "right"]}>
            <View className="py-5 px-5 flex-row justify-between items-center">
                <Pressable onPress={handlePress}>
                    <View className="flex-row gap-2 items-center">
                        <Ionicons name="restaurant" size={24} className="!text-primary" />
                        <Text className="text-2xl font-black text-primary">
                            FASTPOS
                        </Text>
                    </View>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
