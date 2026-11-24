// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import SupplierCard from "./components/SupplierCard";
import SupplierModal from "./components/SupplierModal";
import { useSuppliers } from "./hooks/useSuppliers";
import { SupplierType } from "./types/supplier.type";
import { C } from "@/src/core/theme/palette";
import ExportButton from "@/src/shared/components/ui/ExportButton";
import { ExportDataService } from "@/src/shared/services/expor-data.service";

export default function SuppliersScreen() {
  const s = useSuppliers();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupplierType | null>(null);

  if (s.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.bg,
        }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  const openNew = () => {
    setEditing(null);
    setShowModal(true);
  };
  const openEdit = (sup: SupplierType) => {
    setEditing(sup);
    setShowModal(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={s.filtered}
        keyExtractor={(x) => x.id}
        refreshControl={
          <RefreshControl
            refreshing={s.isRefreshing}
            onRefresh={s.onRefresh}
            tintColor="#ff5722"
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: 16 }}>
            <View className="px-4 mb-4 flex-row justify-between items-center">
              <View>
                <Text
                  style={{ color: C.text, fontSize: 24, fontWeight: "800" }}
                >
                  Proveedores
                </Text>
                <Text style={{ color: C.muted, fontSize: 16 }}>
                  {s.suppliers.length} registrados
                </Text>
              </View>
              <ExportButton onExport={ExportDataService.suppliers} />
            </View>

            {s.totalPayable > 0 && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  padding: 16,
                  backgroundColor: C.card,
                  borderRadius: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: "#f59e0b",
                }}
              >
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Total por pagar
                </Text>
                <Text
                  style={{
                    color: "#f59e0b",
                    fontSize: 30,
                    fontWeight: "900",
                    marginTop: 4,
                  }}
                >
                  {priceFormat(s.totalPayable)}
                </Text>
              </View>
            )}

            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: C.card,
                borderRadius: 12,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: C.line,
              }}
            >
              <Ionicons name="search-outline" size={18} color={C.muted} />
              <TextInput
                placeholder="Buscar proveedor o producto..."
                placeholderTextColor={C.faint}
                value={s.search}
                onChangeText={s.setSearch}
                style={{ flex: 1, color: C.text, fontSize: 16, height: 46 }}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <SupplierCard
            supplier={item}
            payable={s.payables[item.id] ?? 0}
            onPress={() => openEdit(item)}
            onLongPress={() => s.remove(item)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 80 }}>
            <Ionicons name="storefront-outline" size={48} color={C.line2} />
            <Text
              style={{
                color: C.text,
                fontWeight: "700",
                fontSize: 20,
                marginTop: 16,
              }}
            >
              Sin proveedores
            </Text>
            <Text style={{ color: C.muted, fontSize: 16, marginTop: 4 }}>
              Agrega tu primer proveedor
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <Pressable
        onPress={openNew}
        style={{
          position: "absolute",
          bottom: 28,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#ff5722",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <SupplierModal
        visible={showModal}
        supplier={editing}
        onClose={() => setShowModal(false)}
        onSave={(form) => s.save(form, editing)}
      />
    </View>
  );
}
