import { Alert } from "react-native";
import { ContactType } from "../../../types/contact.type";
import { useState } from "react";
import { ContactsService } from "../../../services/contact.service";

export const useProvidersForm = (
  loadData: (silent?: boolean) => Promise<void>,
) => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ContactType | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Falta nombre");
      return;
    }
    setIsSaving(true);
    try {
      if (editingProvider) {
        await ContactsService.update(editingProvider.id, {
          name: name.trim(),
          email: email.trim(),
          type: "proveedor",
          phone,
          notes,
        });
      } else {
        await ContactsService.create({ name: name.trim(), phone, email: email.trim(), type: "proveedor", notes});
      }
      resetForm();
      setShowCreate(false);
      setEditingProvider(null);
      loadData(true);
    } catch {
      Alert.alert("Error", "No se pudo guardar el proveedor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (client: ContactType) => {
    Alert.alert("Eliminar cliente", `¿Eliminar a "${client.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await ContactsService.delete(client.id);
          loadData(true);
        },
      },
    ]);
  };

  const openEdit = (provider: ContactType) => {
    setName(provider.name);
    setPhone(provider.phone || "");
    setEmail(provider.email || "");
    setNotes(provider.notes || "");
    setEditingProvider(provider);
    setShowCreate(true);
  };

  return {
    showCreate,
    setShowCreate,
    editingProvider,
    setEditingProvider,
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    notes,
    setNotes,
    isSaving,
    setIsSaving,
    resetForm,
    handleSave,
    handleDelete,
    openEdit,
  };
};
