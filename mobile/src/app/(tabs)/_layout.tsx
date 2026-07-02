import { useUserRole } from "@/src/shared/hooks/useUserRole";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

const activeColor = "#ff5722";

const tabs = [
  {
    name: "index",
    title: "Menú",
    icon: "book",
    rolesPermitidos: ["admin", "cashier", "kitchen"],
  },
  {
    name: "(orders)/orders",
    title: "Ordenes",
    icon: "receipt-outline",
    rolesPermitidos: ["kitchen"],
  },
  {
    name: "(sales)/sales",
    title: "Ventas",
    icon: "receipt-outline",
    rolesPermitidos: ["admin", "cashier"],
  },
  {
    name: "(inventory)/inventory",
    title: "Inventario",
    icon: "cube-outline",
    rolesPermitidos: ["admin"],
  },
  {
    name: "(expenses)/expenses",
    title: "Gastos",
    icon: "cash-outline",
    rolesPermitidos: ["admin"],
  },
  {
    name: "(cashier)/cashier",
    title: "Cajero",
    icon: "cash-outline",
    rolesPermitidos: ["cashier"],
  },
  {
    name: "(clients)/clients",
    title: "Clientes",
    icon: "people-outline",
    rolesPermitidos: ["admin", "cashier"],
  },
  {
    name: "(reports)/reports",
    title: "Reportes",
    icon: "stats-chart",
    rolesPermitidos: ["admin"],
  },
];

export default function TabLayout() {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <View className="flex-1 bg-[#141414] justify-center items-center">
        <ActivityIndicator size="small" color="#ff5722" />
      </View>
    );
  }

  const rolUsuario = role || "cashier";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabs.map((tab) => {
        const tienePermiso = tab.rolesPermitidos.includes(rolUsuario);

        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarActiveTintColor: activeColor,
              tabBarItemStyle: !tienePermiso ? { display: "none" } : {},

              tabBarButton: (props) => {
                if (!tienePermiso) return null;

                const isActive = props["aria-selected"];

                return (
                  <Pressable
                    onPress={props.onPress}
                    android_ripple={{
                      color: "rgba(255, 87, 34, 0.15)",
                      borderless: true,
                    }}
                    // Opcional: Dale un flex-1 para que ocupe el espacio equitativamente
                    className="flex-1"
                  >
                    <View
                      style={{ borderRadius: 10 }}
                      className={`${isActive ? "bg-primary" : ""} flex-col justify-center items-center rounded-lg py-2 w-full`}
                    >
                      <Ionicons
                        name={tab.icon as any}
                        size={20}
                        color="white"
                      />
                      <Text className="text-white text-xs">{tab.title}</Text>
                    </View>
                  </Pressable>
                );
              },
            }}
          />
        );
      })}
    </Tabs>
  );
}
