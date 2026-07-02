import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useOrders } from "./hooks/useOrders";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import { OrderStatusTabType } from "./types/status-tab.type";
import { useUserRole } from "@/src/shared/hooks/useUserRole";

interface Props {
  onChangeTab?: (tab: "Ventas" | "Ordenes") => void;
  activeGTab?: "Ventas" | "Ordenes";
}

export default function OrdersScreen({ onChangeTab, activeGTab }: Props) {
  const { role, loading: loadingRole } = useUserRole();
  const { orders, loading, renderOrderItem, setActiveTab, activeTab, orderStatusTab, userRole } =
    useOrders(role || "cashier");

  if (loadingRole) {
    return (
      <View className="flex-1 bg-[#141414] justify-center items-center">
        <ActivityIndicator size="small" color="#ff5722" />
      </View>
    );
  }


  return (
    <View className="flex-1 bg-background">
      {/* Tabs Superiores */}
      {userRole !== "kitchen" && (
        <HeaderTabs
          tabs={["Ventas", "Ordenes"]}
          activeTab={activeGTab}
          onChangeTab={(tab) => onChangeTab?.(tab as "Ventas" | "Ordenes")}
        />
      )}
      <HeaderTabs
        tabs={orderStatusTab}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab as OrderStatusTabType)}
      />

      {/* Lista Principal */}
      {loading ? (
        <ActivityIndicator size="large" color="#ff5722" className="mt-8" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text className="text-center text-neutral-400 mt-12 text-sm">
              No hay pedidos en esta sección por ahora. 🍕
            </Text>
          }
        />
      )}
    </View>
  );
}
