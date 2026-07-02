import { useRouter } from "expo-router";
import { Alert, Image, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import PrinterSettingsModal from "@/src/shared/components/printer/PrinterSettingsModal";
import "../../global.css";
import { supabase } from "../config/supabase";
import { useUserRole } from "@/src/shared/hooks/useUserRole";

export default function Header() {
  const router = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [configVisible, setConfigVisible] = useState(false);
  const { role } = useUserRole();
  const userRole = role || "cashier";

  useEffect(() => {
    if (userRole === "admin") {
      setConfigVisible(true);
    }
  }, [userRole]);

  const handlePress = () => {
    router.push("/");
  };

  const handleLogout = async () => {
    Alert.alert("Cerrando sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar sesión",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      className="bg-background shadow-md"
      edges={["top", "left", "right"]}
    >
      <View className="py-4 px-5 flex-row justify-between items-center">
        <Pressable onPress={handlePress}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 110, height: 40 }}
            resizeMode="contain"
          />
        </Pressable>

        <View className="flex-row items-center gap-4">
          {configVisible && (
          <Pressable
            onPress={() => setSettingsVisible(true)}
            android_ripple={{
              color: "rgba(255, 87, 34, 0.1)",
              borderless: true,
              radius: 24,
            }}
            style={{ padding: 4 }}
          >
            <Ionicons name="print-outline" size={24} color="#ff5722" />
          </Pressable>
          )}
          <Pressable onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#ff5722" />
          </Pressable>
        </View>
      </View>

      <PrinterSettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}
