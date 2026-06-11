import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";

const activeColor = "#ff5722";

const tabs = [
  {
    name: "index",
    title: "Menú",
    icon: "book",
  },
  {
    name: "(recipes)/recipes",
    title: "Recetas",
    icon: "restaurant-outline",
  },
  {
    name: "(orders)/orders",
    title: "Pedidos",
    icon: "list",
  },
  {
    name: "(inventory)/inventory",
    title: "Inventario",
    icon: "cube-outline",
  },
  {
    name: "(expenses)/expenses",
    title: "Gastos",
    icon: "cash-outline",
  },
  { name: "(clients)/clients", title: "Clientes", icon: "people-outline" },
  {
    name: "(reports)/reports",
    title: "Reportes",
    icon: "stats-chart",
  },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarActiveTintColor: activeColor,
            tabBarButton: (props) => {
              const isActive = props["aria-selected"];

              return (
                <Pressable
                  onPress={props.onPress}
                  android_ripple={{
                    color: "rgba(255, 87, 34, 0.15)",
                    borderless: true,
                  }}
                >
                  <View
                    style={{ borderRadius: 10 }}
                    className={`${isActive ? "bg-primary" : ""} flex-col justify-center items-center rounded-lg py-4 w-max`}
                  >
                    <Ionicons name={tab.icon as any} size={20} color="white" />
                    <Text className="text-white text-xs">{tab.title}</Text>
                  </View>
                </Pressable>
              );
            },
          }}
        />
      ))}
    </Tabs>
  );
}
