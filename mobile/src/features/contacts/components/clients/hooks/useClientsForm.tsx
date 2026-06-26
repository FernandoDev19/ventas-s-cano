import { Alert } from "react-native";
import { ContactType } from "../../../types/contact.type";
import { useState } from "react";
import { ContactsService } from "../../../services/contact.service";

export const useClientsForm = (
  loadData: (silent?: boolean) => Promise<void>,
) => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<ContactType | null>(null);

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
      if (editingClient) {
        await ContactsService.update(editingClient.id, {
          name: name.trim(),
          email: email.trim(),
          type: "cliente",
          phone,
          notes,
        });
      } else {
        await ContactsService.create({ name: name.trim(), phone, email: email.trim(), type: "cliente", notes});
      }
      resetForm();
      setShowCreate(false);
      setEditingClient(null);
      loadData(true);
    } catch {
      Alert.alert("Error", "No se pudo guardar el cliente.");
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

  const openEdit = (client: ContactType) => {
    setName(client.name);
    setPhone(client.phone || "");
    setEmail(client.email || "");
    setNotes(client.notes || "");
    setEditingClient(client);
    setShowCreate(true);
  };

  return {
    showCreate,
    setShowCreate,
    editingClient,
    setEditingClient,
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
