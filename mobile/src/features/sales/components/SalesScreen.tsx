import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import SaleCard from "./SaleCard";
import SaleDetailModal from "./SaleDetailModal";
import { useSales } from "../hooks/useSales";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import SalesHeader from "./SalesHeader";

interface SalesScreenProps {
  onChangeTab: (tab: "Ventas" | "Ordenes") => void;
  activeTab: "Ventas" | "Ordenes";
}

export default function SalesScreen({
  onChangeTab,
  activeTab,
}: SalesScreenProps) {
  const {
    sales,
    isLoading,
    filteredSales,
    filter,
    setFilter,
    handleMarkAsPaid,
    payingId,
    selectedSaleId,
    setSelectedSaleId,
    onRefresh,
    isRefreshing,
    loadSales,
  } = useSales();

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#0f0f0f" }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
        <Text className="text-neutral-500 mt-3 text-sm">
          Cargando ventas...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#0f0f0f" }}>
      <HeaderTabs
        tabs={["Ventas", "Ordenes"]}
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#ff5722"
          />
        }
        ListHeaderComponent={
          <SalesHeader sales={sales} filter={filter} setFilter={setFilter} />
        }
        renderItem={({ item }) => (
          <SaleCard
            sale={item}
            onMarkAsPaid={handleMarkAsPaid}
            payingId={payingId}
            onPress={() => setSelectedSaleId(item.id ?? null)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <Ionicons name="receipt-outline" size={36} color="#444" />
            </View>
            <Text className="text-white font-bold text-lg text-center mb-1">
              Sin ventas
            </Text>
            <Text className="text-neutral-500 text-sm text-center">
              {filter === "debt"
                ? "¡Genial! No tienes ventas fiadas pendientes"
                : "Aún no hay ventas registradas"}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <SaleDetailModal
        visible={selectedSaleId !== null}
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
        onUpdated={() => loadSales(true)}
      />
    </View>
  );
}
