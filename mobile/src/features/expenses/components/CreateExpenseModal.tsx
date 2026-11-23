import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import DateField from "@/src/shared/components/ui/DateField";
import FormField from "@/src/shared/components/ui/FormField";
import SheetModal, { SheetButton } from "@/src/shared/components/ui/SheetModal";
import { parseLocalDate, toLocalDateStr } from "@/src/shared/helpers/date.helper";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import CategoriesModal from "../../categories/components/CategoriesModal";
import { CategoryType } from "../../categories/types/category.type";
import { ProductsService } from "../../inventory/services/products.service";
import { ProductType } from "../../inventory/types/product.type";
import SupplierPicker from "../../suppliers/components/SupplierPicker";
import { SuppliersService } from "../../suppliers/services/suppliers.service";
import { SupplierType } from "../../suppliers/types/supplier.type";
import ExpensesService from "../services/expense.service";
import { ExpenseKind } from "../types/expense.type";
import ExpenseItemsEditor, { ExpenseRow, rowsToItems, rowsTotal } from "./ExpenseItemsEditor";

type Props = {
  visible: boolean;
  categories: CategoryType[];
  onClose: () => void;
  onCreated: () => void;
};

const METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transf." },
  { value: "nequi", label: "Nequi" },
  { value: "tarjeta", label: "Tarjeta" },
];

const Label = ({ children }: { children: string }) => (
  <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
    {children}
  </Text>
);

const chip = (active: boolean) => ({
  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" as const,
  backgroundColor: active ? "#ff572220" : "#1a1a1a", borderWidth: 1.5, borderColor: active ? "#ff5722" : "#2a2a2a",
});

export default function CreateExpenseModal({ visible, categories, onClose, onCreated }: Props) {
  const [kind, setKind] = useState<ExpenseKind>("operativo");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [method, setMethod] = useState("efectivo");
  const [invoice, setInvoice] = useState("");
  const [isPaid, setIsPaid] = useState(true);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [date, setDate] = useState<string>(toLocalDateStr());
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCats, setShowCats] = useState(false);

  const [products, setProducts] = useState<ProductType[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);

  useEffect(() => {
    if (!visible) return;
    setKind("operativo"); setDescription(""); setAmount(""); setRows([]); setCategoryId(null);
    setSupplierId(null); setMethod("efectivo"); setInvoice(""); setIsPaid(true); setDueDate(null);
    setDate(toLocalDateStr()); setNotes("");
    ProductsService.getProducts().then(setProducts).catch(console.error);
    SuppliersService.getAll().then(setSuppliers).catch(console.error);
  }, [visible]);

  // Al pasar a inversión, los ítems de inventario no aplican
  useEffect(() => {
    if (kind === "inversion") setRows((r) => r.map((x) => ({ ...x, add_to_stock: false })));
  }, [kind]);

  const hasItems = rows.length > 0;
  const itemsTotal = rowsTotal(rows);

  const handleSave = async () => {
    const items = rowsToItems(rows);
    const parsedAmount = hasItems ? itemsTotal : Number(amount.replace(/[^0-9]/g, ""));
    const finalDescription =
      description.trim() ||
      (items.length ? `Compra: ${items.slice(0, 3).map((i) => i.name).join(", ")}` : "");

    if (!finalDescription) return Alert.alert("Falta descripción", "Escribe una descripción o agrega ítems.");
    if (!parsedAmount || parsedAmount <= 0)
      return Alert.alert("Monto inválido", hasItems ? "Ponle costo a los ítems." : "Ingresa un monto mayor a 0.");
    if (!isPaid && !supplierId)
      return Alert.alert("Falta proveedor", "Para dejar un gasto por pagar, selecciona el proveedor.");

    setIsSaving(true);
    try {
      await ExpensesService.createExpense({
        description: finalDescription,
        amount: parsedAmount,
        category_id: categoryId,
        date: parseLocalDate(date),
        notes: notes.trim(),
        kind,
        supplier_id: supplierId,
        payment_method: isPaid ? method : null,
        invoice_number: invoice.trim() || null,
        is_paid: isPaid ? 1 : 0,
        due_date: isPaid ? null : dueDate,
        items,
      });
      onCreated();
      Alert.alert("Gasto registrado", "El gasto se registró correctamente.");
    } catch (err) {
      console.error("Error creando gasto:", err);
      Alert.alert("Error al guardar", `No se pudo registrar el gasto.\n\n${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SheetModal visible={visible} onClose={onClose} eyebrow="Registrar" title="Nuevo gasto">
      {/* Tipo */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {(["operativo", "inversion"] as const).map((k) => (
          <Pressable key={k} onPress={() => setKind(k)} style={chip(kind === k)}>
            <Text style={{ color: kind === k ? "#fff" : "#a3a3a3", fontWeight: "700" }}>
              {k === "operativo" ? "Gasto operativo" : "Inversión"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FormField
        label={hasItems ? "Descripción (opcional)" : "Descripción"}
        value={description}
        onChangeText={setDescription}
        placeholder={kind === "inversion" ? "Ej. Freidora industrial" : "Ej. Compra de pollos"}
      />

      <ExpenseItemsEditor rows={rows} onChange={setRows} products={products} allowProducts={kind === "operativo"} />

      {hasItems ? (
        <View style={{
          backgroundColor: "#1a1a1a", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2a2a2a",
          flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
        }}>
          <Text style={{ color: "#a3a3a3", fontWeight: "600" }}>Total (suma de ítems)</Text>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>{priceFormat(itemsTotal)}</Text>
        </View>
      ) : (
        <FormField label="Monto" prefix="$" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
      )}

      <DateField label="Fecha del gasto" value={date} onChange={(v) => setDate(v)} />

      {/* Categoría */}
      <Label>Categoría</Label>
      <Pressable
        onPress={() => setShowCats(true)}
        className="h-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 flex-row items-center justify-between mb-4"
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="folder-outline" size={18} color={categoryId ? "#ff5722" : "#737373"} />
          <Text style={{ color: categoryId ? "#fff" : "#737373", fontSize: 15 }}>
            {categoryId ? categories.find((c) => c.id === categoryId)?.name : "Selecciona una categoría"}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#555" />
      </Pressable>
      <CategoriesModal
        visible={showCats}
        onSelect={(id) => { setShowCats(false); setCategoryId(id); }}
        onCreated={(id) => { setShowCats(false); setCategoryId(id); }}
        onClose={() => setShowCats(false)}
      />

      <SupplierPicker suppliers={suppliers} selectedId={supplierId} onSelect={setSupplierId} />

      <FormField label="N° de factura (opcional)" value={invoice} onChangeText={setInvoice} placeholder="Ej. FV-1234" />

      {/* Pago */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#1a1a1a", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2a2a2a", marginBottom: 16,
      }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{isPaid ? "Pagado" : "Por pagar (a crédito)"}</Text>
          <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>
            {isPaid ? "Ya salió el dinero" : "Queda como deuda con el proveedor"}
          </Text>
        </View>
        <Switch
          value={isPaid}
          onValueChange={setIsPaid}
          trackColor={{ false: "#f59e0b55", true: "#22c55e55" }}
          thumbColor={isPaid ? "#22c55e" : "#f59e0b"}
        />
      </View>

      {isPaid ? (
        <>
          <Label>Método de pago</Label>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {METHODS.map((m) => (
              <Pressable key={m.value} onPress={() => setMethod(m.value)} style={chip(method === m.value)}>
                <Text style={{ color: method === m.value ? "#fff" : "#a3a3a3", fontWeight: "700", fontSize: 12 }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <DateField label="Fecha límite de pago" value={dueDate} onChange={setDueDate} />
      )}

      <FormField label="Notas (opcional)" value={notes} onChangeText={setNotes} placeholder="Ej. Proveedor, observaciones..." />

      <SheetButton label="Guardar gasto" onPress={handleSave} loading={isSaving} />
    </SheetModal>
  );
}