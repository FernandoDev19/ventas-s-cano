// @theme-migrated
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import DateField from "@/src/shared/components/ui/DateField";
import FormField from "@/src/shared/components/ui/FormField";
import SheetModal, { SheetButton } from "@/src/shared/components/ui/SheetModal";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { PayForm, PayrollService } from "../services/payroll.service";
import { EmployeeType } from "../types/employee.type";
import { C } from "@/src/core/theme/palette";

type Props = {
  visible: boolean;
  employee: EmployeeType | null;
  onClose: () => void;
  onPay: (form: PayForm) => Promise<void>;
};

const num = (s: string) => Number(s.replace(/[^0-9]/g, "")) || 0;

export default function PayrollModal({
  visible,
  employee,
  onClose,
  onPay,
}: Props) {
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [base, setBase] = useState("");
  const [bonuses, setBonuses] = useState("");
  const [deductions, setDeductions] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !employee) return;
    const p = PayrollService.suggestPeriod(employee.pay_type);
    setStart(p.start);
    setEnd(p.end);
    setBase(String(employee.base_salary));
    setBonuses("");
    setDeductions("");
    setNotes("");
  }, [visible, employee]);

  const net = num(base) + num(bonuses) - num(deductions);

  const submit = async () => {
    if (!employee || !start || !end) return;
    if (end < start)
      return Alert.alert(
        "Fechas inválidas",
        "La fecha final no puede ser anterior a la inicial.",
      );
    if (net <= 0)
      return Alert.alert(
        "Monto inválido",
        "El neto a pagar debe ser mayor a 0.",
      );

    const run = async () => {
      setSaving(true);
      try {
        await onPay({
          period_start: start,
          period_end: end,
          base: num(base),
          bonuses: num(bonuses),
          deductions: num(deductions),
          notes: notes.trim(),
        });
        onClose();
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "No se pudo registrar el pago.");
      } finally {
        setSaving(false);
      }
    };

    if (await PayrollService.findOverlap(employee.id, start, end)) {
      Alert.alert(
        "Periodo ya pagado",
        "Ya hay un pago de este empleado que se cruza con estas fechas. ¿Registrar de todas formas?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Registrar", onPress: run },
        ],
      );
    } else {
      run();
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      eyebrow="Pagar nómina"
      title={employee?.name ?? ""}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <DateField label="Desde" value={start} onChange={setStart} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label="Hasta" value={end} onChange={setEnd} />
        </View>
      </View>

      <FormField
        label="Pago base"
        prefix="$"
        value={base}
        onChangeText={setBase}
        keyboardType="numeric"
      />
      <FormField
        label="Bonos / extras / horas extra"
        prefix="+"
        value={bonuses}
        onChangeText={setBonuses}
        keyboardType="numeric"
        placeholder="0"
      />
      <FormField
        label="Descuentos / adelantos"
        prefix="-"
        value={deductions}
        onChangeText={setDeductions}
        keyboardType="numeric"
        placeholder="0"
      />
      <FormField
        label="Notas"
        value={notes}
        onChangeText={setNotes}
        placeholder="Opcional"
      />

      <View
        style={{
          backgroundColor: C.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: C.line,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text style={{ color: C.soft, fontWeight: "600" }}>Neto a pagar</Text>
        <Text
          style={{
            color: net > 0 ? "#22c55e" : "#ef4444",
            fontSize: 24,
            fontWeight: "900",
          }}
        >
          {priceFormat(net)}
        </Text>
      </View>

      <SheetButton label="Registrar pago" onPress={submit} loading={saving} />
    </SheetModal>
  );
}
