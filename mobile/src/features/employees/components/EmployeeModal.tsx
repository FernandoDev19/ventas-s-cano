import { useEffect, useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import DateField from "@/src/shared/components/ui/DateField";
import FormField from "@/src/shared/components/ui/FormField";
import SheetModal, { SheetButton } from "@/src/shared/components/ui/SheetModal";
import { EmployeeForm, EmployeeType, PAY_TYPE_LABEL, PayType } from "../types/employee.type";

type Props = {
  visible: boolean;
  employee: EmployeeType | null;
  onClose: () => void;
  onSave: (form: EmployeeForm) => Promise<void>;
};

const PAY_TYPES: PayType[] = ["mensual", "quincenal", "diario"];

export default function EmployeeModal({ visible, employee, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [payType, setPayType] = useState<PayType>("mensual");
  const [salary, setSalary] = useState("");
  const [hireDate, setHireDate] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(employee?.name ?? "");
    setRole(employee?.role ?? "");
    setPhone(employee?.phone ?? "");
    setPayType(employee?.pay_type ?? "mensual");
    setSalary(employee ? String(employee.base_salary) : "");
    setHireDate(employee?.hire_date ?? null);
    setActive(employee ? employee.is_active === 1 : true);
    setNotes(employee?.notes ?? "");
  }, [visible, employee]);

  const submit = async () => {
    const base = Number(salary.replace(/[^0-9]/g, ""));
    if (!name.trim()) return Alert.alert("Falta nombre", "Ingresa el nombre del empleado.");
    if (!base) return Alert.alert("Pago inválido", "Ingresa el pago base mayor a 0.");
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), role: role.trim(), phone: phone.trim(), pay_type: payType,
        base_salary: base, hire_date: hireDate, is_active: active ? 1 : 0, notes: notes.trim(),
      });
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar el empleado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal visible={visible} onClose={onClose} eyebrow={employee ? "Editar" : "Nuevo"} title={employee ? employee.name : "Empleado"}>
      <FormField label="Nombre *" value={name} onChangeText={setName} placeholder="Ej. María Gómez" />
      <FormField label="Cargo" value={role} onChangeText={setRole} placeholder="Cocinera, mesero, domiciliario..." />
      <FormField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Se le paga
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {PAY_TYPES.map((t) => {
          const a = payType === t;
          return (
            <Pressable
              key={t}
              onPress={() => setPayType(t)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                backgroundColor: a ? "#ff572220" : "#1a1a1a", borderWidth: 1.5, borderColor: a ? "#ff5722" : "#2a2a2a",
              }}
            >
              <Text style={{ color: a ? "#fff" : "#a3a3a3", fontWeight: "700", textTransform: "capitalize" }}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <FormField
        label={`Pago base por ${PAY_TYPE_LABEL[payType]} *`}
        prefix="$" value={salary} onChangeText={setSalary} keyboardType="numeric" placeholder="0"
      />
      <DateField label="Fecha de ingreso" value={hireDate} onChange={setHireDate} />
      <FormField label="Notas" value={notes} onChangeText={setNotes} placeholder="Horario, observaciones..." />

      {employee && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Empleado activo</Text>
          <Switch
            value={active} onValueChange={setActive}
            trackColor={{ false: "#2a2a2a", true: "#ff572233" }} thumbColor={active ? "#ff5722" : "#a3a3a3"}
          />
        </View>
      )}

      <SheetButton label="Guardar empleado" onPress={submit} loading={saving} />
    </SheetModal>
  );
}