import { Alert } from "react-native";
import { ClientType } from "../types/client.type";
import { ClientsService } from "../services/clients.service";
import { useState } from "react";

export const useClientsForm = (
  loadData: (silent?: boolean) => Promise<void>,
) => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientType | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setPhone("");
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
        await ClientsService.update(editingClient.id, {
          name: name.trim(),
          phone,
          notes,
        });
      } else {
        await ClientsService.create({ name: name.trim(), phone, notes });
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

  const handleDelete = (client: ClientType) => {
    Alert.alert("Eliminar cliente", `¿Eliminar a "${client.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await ClientsService.delete(client.id);
          loadData(true);
        },
      },
    ]);
  };

  const openEdit = (client: ClientType) => {
    setName(client.name);
    setPhone(client.phone || "");
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
