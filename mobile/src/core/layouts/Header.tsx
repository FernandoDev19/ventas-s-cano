import { useRouter } from "expo-router";
import { Image, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import PrinterSettingsModal from "@/src/shared/components/printer/PrinterSettingsModal";
import "../../global.css";

export default function Header() {
    const router = useRouter();
    const [settingsVisible, setSettingsVisible] = useState(false);

    const handlePress = () => {
        router.push("/");
    };

    return (
        <SafeAreaView className="bg-background shadow-md" edges={["top", "left", "right"]}>
            <View className="py-4 px-5 flex-row justify-between items-center">
                <Pressable onPress={handlePress}>
                    <Image source={require("@/assets/images/logo.png")} style={{ width: 110, height: 40 }} resizeMode="contain" />
                </Pressable>

                <Pressable 
                    onPress={() => setSettingsVisible(true)}
                    android_ripple={{ color: "rgba(255, 87, 34, 0.1)", borderless: true, radius: 24 }}
                    style={{ padding: 4 }}
                >
                    <Ionicons name="print-outline" size={24} color="#ff5722" />
                </Pressable>
            </View>

            <PrinterSettingsModal 
                visible={settingsVisible} 
                onClose={() => setSettingsVisible(false)} 
            />
        </SafeAreaView>
    );
}

