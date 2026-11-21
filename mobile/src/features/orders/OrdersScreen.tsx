import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "./hooks/useOrders";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import { OrderStatusTabType } from "./types/status-tab.type";
import { useUserRole } from "@/src/shared/hooks/useUserRole";
import { OrderCardKDS } from "./components/OrderCardKDS";

interface Props {
  onChangeTab?: (tab: "Ventas" | "Ordenes") => void;
  activeGTab?: "Ventas" | "Ordenes";
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendientes", color: "#f59e0b" },
  accepted: { label: "Aceptados", color: "#3b82f6" },
  preparing: { label: "Preparando", color: "#f97316" },
  ready: { label: "Listos", color: "#22c55e" },
  delivered: { label: "Entregados", color: "#a3a3a3" },
  cancelled: { label: "Cancelados", color: "#ef4444" },
};

export default function OrdersScreen({ onChangeTab, activeGTab }: Props) {
  const { role, loading: loadingRole } = useUserRole();
  const {
    orders,
    loading,
    setActiveTab,
    activeTab,
    orderStatusTab,
    userRole,
    handleCambiarEstado,
    abrirWhatsAppCliente,
    handlePrintCashierTicket,
    cargarOrdenes,
  } = useOrders(role || "cashier");

  if (loadingRole) {
    return (
      <View className="flex-1 bg-[#141414] justify-center items-center">
        <ActivityIndicator size="small" color="#ff5722" />
      </View>
    );
  }

  const meta = STATUS_META[activeTab];

  return (
    <View className="flex-1 bg-background">
      {userRole !== "kitchen" && (
        <HeaderTabs
          tabs={["Ventas", "Ordenes"]}
          activeTab={activeGTab}
          onChangeTab={(tab) => onChangeTab?.(tab as "Ventas" | "Ordenes")}
        />
      )}

      {/* Título */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>
          {userRole === "kitchen" ? "Cocina" : "Pedidos"}
        </Text>
        <Text style={{ color: "#737373", fontSize: 13 }}>
          {orders.length} en {meta?.label.toLowerCase()}
        </Text>
      </View>

      {/* Chips de estado */}
      <View style={{ height: 56 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            alignItems: "center",
          }}
        >
          {(orderStatusTab as string[]).map((tab) => {
            const m = STATUS_META[tab];
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab as OrderStatusTabType)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? m.color : "#1a1a1a",
                  borderWidth: 1,
                  borderColor: active ? m.color : "#333",
                }}
              >
                <Text
                  style={{
                    color: active ? "#fff" : "#a3a3a3",
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && orders.length === 0 ? (
        <ActivityIndicator size="large" color="#ff5722" className="mt-8" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => cargarOrdenes(activeTab)}
              tintColor="#ff5722"
            />
          }
          renderItem={({ item }) => (
            <OrderCardKDS
              item={item}
              onAccionEstado={(nuevoEstado) =>
                handleCambiarEstado(item, nuevoEstado as any)
              }
              onChatCliente={() =>
                abrirWhatsAppCliente(item.customer_phone, item.customer_name)
              }
              onPrintBill={() => handlePrintCashierTicket(item)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 70 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#1a1a1a",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="receipt-outline" size={36} color="#444" />
              </View>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
                Sin pedidos
              </Text>
              <Text style={{ color: "#737373", fontSize: 13, marginTop: 4 }}>
                No hay pedidos en esta sección por ahora
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}