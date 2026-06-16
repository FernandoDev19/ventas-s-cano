import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useOrders } from "./hooks/useOrders";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import { ORDER_STATUS_TAB, OrderStatusTabType } from "./types/status-tab.type";

interface Props {
  onChangeTab: (tab: "Ventas" | "Ordenes") => void;
  activeGTab: "Ventas" | "Ordenes";
}

export default function OrdersScreen({ onChangeTab, activeGTab }: Props) {
  const { orders, loading, renderOrderItem, setActiveTab, activeTab } =
    useOrders();

  return (
    <View className="flex-1 bg-background">
      {/* Tabs Superiores */}
      <HeaderTabs
        tabs={Object.values(ORDER_STATUS_TAB)}
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
