import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import PrinterSettingsModal from "@/src/shared/components/printer/PrinterSettingsModal";
import { supabase } from "@/src/core/config/supabase";
import { BYPASS_AUTH, useUserRole } from "@/src/shared/hooks/useUserRole";
import { ThemeToggle } from "@/src/core/theme/ThemeToggle";
import { useTheme } from "@/src/core/theme/ThemeContext";
import { useSettings } from "@/src/core/context/SettingsContext";

type Item = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  roles: string[];
};

export default function MoreTab() {
  const router = useRouter();
  const { role } = useUserRole();
  const { c } = useTheme();
  const [printerVisible, setPrinterVisible] = useState(false);
  const userRole = role || "cashier";
  const { allowNoStock, setAllowNoStock } = useSettings();

  const items: Item[] = [
    {
      title: "Inventario y recetas",
      subtitle: "Productos, stock y platos",
      icon: "cube-outline",
      roles: ["admin"],
      onPress: () => router.push("/(tabs)/(inventory)/inventory"),
    },
    {
      title: "Clientes y fiados",
      subtitle: "Quién te debe",
      icon: "people-outline",
      roles: ["admin", "cashier"],
      onPress: () => router.push("/(tabs)/(clients)/clients"),
    },
    {
      title: "Reportes",
      subtitle: "Ventas, gastos y ganancia",
      icon: "stats-chart",
      roles: ["admin"],
      onPress: () => router.push("/(tabs)/(reports)/reports"),
    },
    {
      title: "Arqueo de caja",
      subtitle: "Abrir / cerrar turno",
      icon: "wallet-outline",
      roles: ["admin"],
      onPress: () => router.push("/(tabs)/(cashier)/cashier"),
    },
    {
      title: "Impresoras",
      subtitle: "Caja y cocina",
      icon: "print-outline",
      roles: ["admin"],
      onPress: () => setPrinterVisible(true),
    },
    {
      title: "Empleados y nómina",
      subtitle: "Pagos y personal",
      icon: "people-circle-outline",
      roles: ["admin"],
      onPress: () => router.push("/(tabs)/(employees)/employees"),
    },
    {
      title: "Proveedores",
      subtitle: "Contactos y por pagar",
      icon: "storefront-outline",
      roles: ["admin"],
      onPress: () => router.push("/(tabs)/(suppliers)/suppliers"),
    },
  ];

  const handleLogout = () => {
    if (BYPASS_AUTH) {
      Alert.alert(
        "Modo Administrador",
        "El inicio de sesión está desactivado.",
      );
      return;
    }
    Alert.alert("Cerrar sesión", "¿Seguro?", [
      { text: "Cancelar", style: "cancel" },
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
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>
          Más
        </Text>
        <Text style={{ color: c.muted, fontSize: 14, marginBottom: 16 }}>
          Todo lo demás, a un toque
        </Text>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <ThemeToggle />
        </View>

        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: c.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.line,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 15 }}>
              Vender sin stock
            </Text>
            <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>
              {allowNoStock
                ? "Se puede vender aunque el inventario esté en 0 (el stock queda en negativo)."
                : "Los productos agotados no se pueden agregar al pedido."}
            </Text>
          </View>
          <Switch
            value={allowNoStock}
            onValueChange={setAllowNoStock}
            trackColor={{ false: c.line, true: "#ff572266" }}
            thumbColor={allowNoStock ? "#ff5722" : c.soft}
          />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {items
            .filter((i) => i.roles.includes(userRole))
            .map((item) => (
              <Pressable
                key={item.title}
                onPress={item.onPress}
                style={{
                  width: "47.5%",
                  backgroundColor: c.card,
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: c.line,
                  minHeight: 120,
                  justifyContent: "space-between",
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
                  <Ionicons name={item.icon} size={22} color="#ff5722" />
                </View>
                <View>
                  <Text
                    style={{ color: c.text, fontWeight: "800", fontSize: 15 }}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>
                    {item.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}
        </View>

        <Pressable
          onPress={handleLogout}
          style={{
            marginTop: 24,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "#ef444415",
            borderWidth: 1,
            borderColor: "#ef444433",
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={{ color: "#ef4444", fontWeight: "700" }}>
            Cerrar sesión
          </Text>
        </Pressable>
      </ScrollView>

      <PrinterSettingsModal
        visible={printerVisible}
        onClose={() => setPrinterVisible(false)}
      />
    </View>
  );
}
