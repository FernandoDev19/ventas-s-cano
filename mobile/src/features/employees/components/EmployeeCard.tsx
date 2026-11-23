import { Pressable, Text, View } from "react-native";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { EmployeeType, PAY_TYPE_LABEL } from "../types/employee.type";

type Props = {
  employee: EmployeeType;
  onPress: () => void;
  onLongPress: () => void;
  onPay: () => void;
};

export default function EmployeeCard({ employee, onPress, onLongPress, onPay }: Props) {
  const active = employee.is_active === 1;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        marginHorizontal: 16, marginBottom: 10, padding: 14, backgroundColor: "#1a1a1a", borderRadius: 16,
        borderWidth: 1, borderColor: "#2a2a2a", flexDirection: "row", alignItems: "center", gap: 12,
        opacity: active ? 1 : 0.55,
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#ff572222", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#ff5722", fontWeight: "900", fontSize: 18 }}>{employee.name[0]?.toUpperCase()}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }} numberOfLines={1}>{employee.name}</Text>
        <Text style={{ color: "#737373", fontSize: 12 }}>
          {employee.role || "Empleado"} · {priceFormat(employee.base_salary)}/{PAY_TYPE_LABEL[employee.pay_type]}
        </Text>
        {!active && <Text style={{ color: "#ef4444", fontSize: 11, fontWeight: "700", marginTop: 2 }}>INACTIVO</Text>}
      </View>

      {active && (
        <Pressable
          onPress={onPay}
          style={{ backgroundColor: "#ff5722", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>Pagar</Text>
        </Pressable>
      )}
    </Pressable>
  );
}