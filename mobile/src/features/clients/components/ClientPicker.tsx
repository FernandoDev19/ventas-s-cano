import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { ClientType } from "../types/client.type";
import { useState } from "react";
import { ClientsService } from "../services/clients.service";
import { SyncService } from "@/src/shared/services/sync.service";

type Props = {
  setSelectedClientId: (id: string) => void;
  selectedClientId: string | null;
  clients: ClientType[];
  onClientCreated?: (newClient: ClientType) => void;
};

export default function ClientPicker({
  setSelectedClientId,
  selectedClientId,
  clients,
  onClientCreated,
}: Props) {
  const [showClientPicker, setShowClientPicker] = useState(false);

  // Estado para el mini-formulario de creación rápida
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Nombre del cliente seleccionado (puede que sea recién creado y no esté en `clients` aún)
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);

  const displayName = selectedClientId
    ? (clients.find((c) => c.id === selectedClientId)?.name ?? selectedClientName)
    : null;

  const handleQuickCreate = async () => {
    if (!newName.trim()) {
      Alert.alert("Nombre requerido", "Ingresa al menos el nombre del cliente.");
      return;
    }
    setIsSaving(true);
    try {
      const created = await ClientsService.create({
        name: newName.trim(),
        phone: newPhone.trim(),
        notes: "",
      });
      setSelectedClientId(created.id);
      setSelectedClientName(created.name);
      onClientCreated?.(created);
      setNewName("");
      setNewPhone("");
      setShowQuickCreate(false);
      setShowClientPicker(false);
      // Sincronizar con Supabase en segundo plano
      SyncService.run().catch((e) =>
        console.warn("Error sync tras crear cliente rápido:", e)
      );
    } catch {
      Alert.alert("Error", "No se pudo crear el cliente. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Botón / chip para abrir el picker */}
      <View className="mb-4">
        <Pressable
          onPress={() => setShowClientPicker(true)}
          className="h-16 bg-neutral-800 shadow-lg rounded-lg px-4 flex-row items-center justify-between"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <Ionicons
              name="person-outline"
              size={18}
              color={selectedClientId ? "#ff5722" : "#737373"}
            />
            <Text
              style={{
                color: selectedClientId ? "#fff" : "#737373",
                fontSize: 15,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {displayName ?? "Asignar cliente (opcional)"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {selectedClientId && (
              <Pressable
                onPress={() => {
                  setSelectedClientId("");
                  setSelectedClientName(null);
                }}
                hitSlop={8}
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 14,
                  padding: 4,
                }}
              >
                <Ionicons name="close" size={14} color="#737373" />
              </Pressable>
            )}
            <Ionicons name="chevron-down" size={16} color="#555" />
          </View>
        </Pressable>
      </View>

      {/* ——— Modal de selección / lista ——— */}
      <Modal visible={showClientPicker} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#141414",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              maxHeight: "65%",
              paddingBottom: 40,
            }}
          >
            {/* Cabecera */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
                Seleccionar Cliente
              </Text>
              <Pressable
                onPress={() => setShowClientPicker(false)}
                style={{ backgroundColor: "#2a2a2a", borderRadius: 20, padding: 8 }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>

            {/* Botón de creación rápida */}
            <Pressable
              onPress={() => setShowQuickCreate(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: "#ff572215",
                borderWidth: 1,
                borderColor: "#ff5722",
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#ff5722",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person-add" size={16} color="#fff" />
              </View>
              <Text style={{ color: "#ff5722", fontWeight: "700", fontSize: 15 }}>
                Crear cliente nuevo
              </Text>
            </Pressable>

            {/* Lista de clientes existentes */}
            <FlatList
              data={clients}
              keyExtractor={(c) => String(c.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedClientId(item.id);
                    setSelectedClientName(item.name);
                    setShowClientPicker(false);
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor:
                      selectedClientId === item.id ? "#ff572222" : "#1a1a1a",
                    borderWidth: 1,
                    borderColor:
                      selectedClientId === item.id ? "#ff5722" : "#2a2a2a",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#ff572233",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#ff5722", fontWeight: "800" }}>
                      {item.name[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {item.name}
                    </Text>
                    {item.phone && (
                      <Text style={{ color: "#737373", fontSize: 12 }}>
                        {item.phone}
                      </Text>
                    )}
                  </View>
                  {selectedClientId === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#ff5722" />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text
                  style={{ color: "#555", textAlign: "center", marginTop: 20 }}
                >
                  No hay clientes registrados aún
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* ——— Modal de creación rápida ——— */}
      <Modal visible={showQuickCreate} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.75)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#141414",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: 40,
              }}
            >
              {/* Cabecera form */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#ff5722",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="person-add" size={18} color="#fff" />
                  </View>
                  <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
                    Nuevo Cliente
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setShowQuickCreate(false);
                    setNewName("");
                    setNewPhone("");
                  }}
                  style={{ backgroundColor: "#2a2a2a", borderRadius: 20, padding: 8 }}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
              </View>

              {/* Campo Nombre */}
              <View style={{ marginBottom: 14 }}>
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  Nombre *
                </Text>
                <View
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: newName.trim() ? "#ff5722" : "#2a2a2a",
                  }}
                >
                  <TextInput
                    placeholder="Ej. Carlos Pérez"
                    placeholderTextColor="#555"
                    value={newName}
                    onChangeText={setNewName}
                    autoFocus
                    style={{ color: "#fff", fontSize: 16, height: 46 }}
                  />
                </View>
              </View>

              {/* Campo Teléfono */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  Teléfono (opcional)
                </Text>
                <View
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "#2a2a2a",
                  }}
                >
                  <TextInput
                    placeholder="Ej. 3001234567"
                    placeholderTextColor="#555"
                    value={newPhone}
                    onChangeText={setNewPhone}
                    keyboardType="phone-pad"
                    style={{ color: "#fff", fontSize: 16, height: 46 }}
                  />
                </View>
              </View>

              {/* Botón guardar */}
              <Pressable
                onPress={handleQuickCreate}
                disabled={isSaving}
                style={{
                  backgroundColor: "#ff5722",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
                    Guardar y Seleccionar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
