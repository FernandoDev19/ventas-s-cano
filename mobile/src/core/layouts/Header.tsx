import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
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
                    <Image source={require("@/assets/images/logo.png")} style={{ width: 135, height: 45 }} resizeMode="contain" />
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
