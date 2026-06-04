// mobile/src/features/clients/components/ClientsScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Modal, Pressable,
  RefreshControl, Text, TextInput, View,
} from "react-native";
import { ClientsService } from "../services/clients.service";
import { ClientType } from "../types/client.type";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { useFocusEffect } from "expo-router";

export default function ClientsScreen() {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientType | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const debtors = await ClientsService.getDebtors();
      // También traer clientes sin deuda
      const all = await ClientsService.getAll();
      // Merge: deudores con info de deuda, el resto sin
      const debtorIds = new Set(debtors.map(d => d.id));
      const nonDebtors = all.filter(c => !debtorIds.has(c.id)).map(c => ({ ...c, totalDebt: 0, salesCount: 0 }));
      setClients([...debtors, ...nonDebtors]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useFocusEffect(
    useCallback(() => {
        loadData();
    }, [loadData])
  );

  const resetForm = () => { setName(""); setPhone(""); setNotes(""); };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Falta nombre"); return; }
    setIsSaving(true);
    try {
      if (editingClient) {
        await ClientsService.update(editingClient.id, { name: name.trim(), phone, notes });
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
        text: "Eliminar", style: "destructive",
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

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f0f0f" }}>
      <ActivityIndicator size="large" color="#ff5722" />
    </View>
  );

  const debtors = clients.filter(c => c.totalDebt > 0);
  const totalDebt = debtors.reduce((s, c) => s + c.totalDebt, 0);

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <FlatList
        data={clients}
        keyExtractor={c => String(c.id)}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadData(true); }} tintColor="#ff5722" />}
        ListHeaderComponent={
          <View style={{ paddingTop: 16 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>Clientes</Text>
              <Text style={{ color: "#737373", fontSize: 14 }}>{clients.length} registrados · {debtors.length} con deuda</Text>
            </View>

            {/* Resumen deuda total */}
            {debtors.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 16, borderLeftWidth: 4, borderLeftColor: "#f59e0b" }}>
                <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Total por cobrar</Text>
                <Text style={{ color: "#f59e0b", fontSize: 32, fontWeight: "900", marginTop: 4 }}>{priceFormat(totalDebt)}</Text>
                <Text style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{debtors.length} cliente{debtors.length !== 1 ? "s" : ""} deben</Text>
              </View>
            )}

            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Lista de Clientes</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            onLongPress={() => handleDelete(item)}
            style={{
              marginHorizontal: 16, marginBottom: 10, padding: 14,
              backgroundColor: "#1a1a1a", borderRadius: 16,
              borderWidth: 1, borderColor: item.totalDebt > 0 ? "#f59e0b33" : "#2a2a2a",
              flexDirection: "row", alignItems: "center", gap: 12,
            }}
          >
            {/* Avatar */}
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: item.totalDebt > 0 ? "#f59e0b22" : "#ff572222", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: item.totalDebt > 0 ? "#f59e0b" : "#ff5722", fontWeight: "900", fontSize: 18 }}>
                {item.name[0].toUpperCase()}
              </Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{item.name}</Text>
              {item.phone ? <Text style={{ color: "#737373", fontSize: 12 }}>{item.phone}</Text> : null}
              {item.salesCount > 0 && (
                <Text style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{item.salesCount} venta{item.salesCount !== 1 ? "s" : ""} fiada{item.salesCount !== 1 ? "s" : ""}</Text>
              )}
            </View>

            {/* Deuda */}
            {item.totalDebt > 0 && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#f59e0b", fontWeight: "800", fontSize: 16 }}>{priceFormat(item.totalDebt)}</Text>
                <Text style={{ color: "#f59e0b", fontSize: 10, opacity: 0.7 }}>por cobrar</Text>
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
            <Ionicons name="people-outline" size={48} color="#333" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18, marginTop: 16 }}>Sin clientes</Text>
            <Text style={{ color: "#737373", fontSize: 14, marginTop: 4 }}>Agrega tu primer cliente</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FAB */}
      <Pressable
        onPress={() => { resetForm(); setEditingClient(null); setShowCreate(true); }}
        style={{ position: "absolute", bottom: 28, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#ff5722", alignItems: "center", justifyContent: "center" }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Modal crear/editar */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#141414", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
                {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
              </Text>
              <Pressable onPress={() => setShowCreate(false)} style={{ backgroundColor: "#2a2a2a", borderRadius: 20, padding: 8 }}>
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>

            {[
              { label: "Nombre", value: name, setter: setName, placeholder: "Ej. Carlos Pérez", keyboard: "default" },
              { label: "Teléfono (opcional)", value: phone, setter: setPhone, placeholder: "Ej. 3001234567", keyboard: "phone-pad" },
              { label: "Notas (opcional)", value: notes, setter: setNotes, placeholder: "Ej. Vecino del barrio", keyboard: "default" },
            ].map(field => (
              <View key={field.label} style={{ marginBottom: 16 }}>
                <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{field.label}</Text>
                <View style={{ backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#2a2a2a" }}>
                  <TextInput
                    placeholder={field.placeholder}
                    placeholderTextColor="#555"
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.keyboard as any}
                    style={{ color: "#fff", fontSize: 16, height: 46 }}
                  />
                </View>
              </View>
            ))}

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={{ backgroundColor: "#ff5722", paddingVertical: 16, borderRadius: 16, alignItems: "center", opacity: isSaving ? 0.7 : 1, marginTop: 8 }}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>Guardar</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}