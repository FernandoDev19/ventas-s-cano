import { useEffect, useState } from "react";
import { Alert } from "react-native";
import FormField from "@/src/shared/components/ui/FormField";
import SheetModal, { SheetButton } from "@/src/shared/components/ui/SheetModal";
import { SupplierForm, SupplierType } from "../types/supplier.type";

type Props = {
  visible: boolean;
  supplier: SupplierType | null;
  onClose: () => void;
  onSave: (form: SupplierForm) => Promise<void>;
};

export default function SupplierModal({ visible, supplier, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [products, setProducts] = useState("");
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(supplier?.name ?? "");
    setContact(supplier?.contact_name ?? "");
    setPhone(supplier?.phone ?? "");
    setProducts(supplier?.products_supplied ?? "");
    setTerms(supplier?.payment_terms_days ? String(supplier.payment_terms_days) : "");
    setNotes(supplier?.notes ?? "");
  }, [visible, supplier]);

  const submit = async () => {
    if (!name.trim()) return Alert.alert("Falta nombre", "Ingresa el nombre del proveedor.");
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        contact_name: contact.trim(),
        phone: phone.trim(),
        products_supplied: products.trim(),
        payment_terms_days: Number(terms.replace(/[^0-9]/g, "")) || 0,
        notes: notes.trim(),
      });
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar el proveedor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      eyebrow={supplier ? "Editar" : "Nuevo"}
      title={supplier ? supplier.name : "Proveedor"}
    >
      <FormField label="Nombre *" value={name} onChangeText={setName} placeholder="Ej. Avícola El Pollón" />
      <FormField label="Contacto" value={contact} onChangeText={setContact} placeholder="Ej. Don Pedro" />
      <FormField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="3001234567" />
      <FormField label="Qué te vende" value={products} onChangeText={setProducts} placeholder="Pollos, gaseosas..." />
      <FormField label="Días de crédito (0 = contado)" value={terms} onChangeText={setTerms} keyboardType="numeric" placeholder="0" />
      <FormField label="Notas" value={notes} onChangeText={setNotes} placeholder="Día de visita, condiciones..." />
      <SheetButton label="Guardar proveedor" onPress={submit} loading={saving} />
    </SheetModal>
  );
}