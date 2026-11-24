// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import EmployeeCard from "./components/EmployeeCard";
import EmployeeModal from "./components/EmployeeModal";
import PayrollModal from "./components/PayrollModal";
import { useEmployees } from "./hooks/useEmployees";
import { EmployeeType } from "./types/employee.type";
import { C } from "@/src/core/theme/palette";
import ExportButton from "@/src/shared/components/ui/ExportButton";
import { ExportDataService } from "@/src/shared/services/expor-data.service";

type Tab = "empleados" | "nomina";

export default function EmployeesScreen() {
  const h = useEmployees();
  const [tab, setTab] = useState<Tab>("empleados");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmployeeType | null>(null);
  const [payTarget, setPayTarget] = useState<EmployeeType | null>(null);

  if (h.isLoading) {
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

  const refresh = (
    <RefreshControl
      refreshing={h.isRefreshing}
      onRefresh={h.onRefresh}
      tintColor="#ff5722"
    />
  );

  const summary = (
    <View style={{ paddingTop: 16 }}>
      <View className="px-4 mb-4 flex-row justify-between items-center">
        <View>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: "800" }}>
             {tab === "empleados" ? "Empleados" : "Nómina"}
          </Text>
          <Text style={{ color: C.muted, fontSize: 16 }}>
            {h.activeCount} activos
          </Text>
        </View>
        <ExportButton onExport={ExportDataService.payroll} />
      </View>

      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          padding: 16,
          backgroundColor: C.card,
          borderRadius: 16,
          borderLeftWidth: 4,
          borderLeftColor: "#ff5722",
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
          Pagado este mes
        </Text>
        <Text
          style={{
            color: C.text,
            fontSize: 30,
            fontWeight: "900",
            marginTop: 4,
          }}
        >
          {priceFormat(h.paidThisMonth)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <HeaderTabs
        tabs={["empleados", "nomina"] as Tab[]}
        activeTab={tab}
        onChangeTab={setTab}
      />

      {tab === "empleados" ? (
        <FlatList
          data={h.employees}
          keyExtractor={(e) => e.id}
          refreshControl={refresh}
          ListHeaderComponent={summary}
          renderItem={({ item }) => (
            <EmployeeCard
              employee={item}
              onPress={() => {
                setEditing(item);
                setShowForm(true);
              }}
              onLongPress={() => h.removeEmployee(item)}
              onPay={() => setPayTarget(item)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 80 }}>
              <Ionicons name="people-outline" size={48} color={C.line2} />
              <Text
                style={{
                  color: C.text,
                  fontWeight: "700",
                  fontSize: 20,
                  marginTop: 16,
                }}
              >
                Sin empleados
              </Text>
              <Text style={{ color: C.muted, fontSize: 16, marginTop: 4 }}>
                Agrega el primero con el botón +
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      ) : (
        <FlatList
          data={h.history}
          keyExtractor={(p) => p.id}
          refreshControl={refresh}
          ListHeaderComponent={summary}
          renderItem={({ item: p }) => (
            <Pressable
              onLongPress={() => h.cancelPayment(p)}
              style={{
                marginHorizontal: 16,
                marginBottom: 10,
                padding: 14,
                backgroundColor: C.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.line,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: C.text,
                    fontWeight: "700",
                    fontSize: 17,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {p.employee_name ?? "Empleado eliminado"}
                </Text>
                <Text
                  style={{ color: "#22c55e", fontWeight: "900", fontSize: 18 }}
                >
                  {priceFormat(p.net_amount)}
                </Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 14, marginTop: 2 }}>
                {p.period_start} → {p.period_end}
              </Text>
              {(p.bonuses > 0 || p.deductions > 0) && (
                <Text style={{ color: C.soft, fontSize: 13, marginTop: 4 }}>
                  Base {priceFormat(p.base_amount)}
                  {p.bonuses > 0 ? ` · +${priceFormat(p.bonuses)}` : ""}
                  {p.deductions > 0 ? ` · -${priceFormat(p.deductions)}` : ""}
                </Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 80 }}>
              <Ionicons name="receipt-outline" size={48} color={C.line2} />
              <Text
                style={{
                  color: C.text,
                  fontWeight: "700",
                  fontSize: 20,
                  marginTop: 16,
                }}
              >
                Sin pagos
              </Text>
              <Text style={{ color: C.muted, fontSize: 15, marginTop: 4 }}>
                Mantén presionado un pago para anularlo
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {tab === "empleados" && (
        <Pressable
          onPress={() => {
            setEditing(null);
            setShowForm(true);
          }}
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
      )}

      <EmployeeModal
        visible={showForm}
        employee={editing}
        onClose={() => setShowForm(false)}
        onSave={(form) => h.saveEmployee(form, editing)}
      />
      <PayrollModal
        visible={payTarget !== null}
        employee={payTarget}
        onClose={() => setPayTarget(null)}
        onPay={(form) => h.payEmployee(payTarget!, form)}
      />
    </View>
  );
}
