// @theme-migrated
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
import { C } from "@/src/core/theme/palette";

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
    scopedSales,
    scope,
    setScope,
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
        style={{ backgroundColor: C.bg }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
        <Text className="text-neutral-500 mt-3 text-base">
          Cargando ventas...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
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
          <SalesHeader
            sales={scopedSales}
            allSales={sales}
            filter={filter}
            setFilter={setFilter}
            scope={scope}
            setScope={setScope}
          />
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
              style={{ backgroundColor: C.card }}
            >
              <Ionicons name="receipt-outline" size={36} color="#444" />
            </View>
            <Text className="text-neutral-900 dark:text-white font-bold text-xl text-center mb-1">
              Sin ventas
            </Text>
            <Text className="text-neutral-500 text-base text-center">
              {filter === "debt"
                ? "¡Genial! No tienes ventas fiadas pendientes"
                : scope === "shift"
                  ? "Sin ventas en este turno. Las anteriores están en Historial."
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
