// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { ClientType } from "../types/client.type";
import { ClientsService } from "../services/clients.service";
import { C } from "@/src/core/theme/palette";

type Props = {
  selectedClientId: string | null;
  setSelectedClientId: (id: string) => void;
  clients: ClientType[];
  onClientCreated?: (c: ClientType) => void;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export default function ClientPicker({
  selectedClientId,
  setSelectedClientId,
  clients,
  onClientCreated,
}: Props) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [created, setCreated] = useState<ClientType | null>(null);

  const selected =
    clients.find((c) => c.id === selectedClientId) ??
    (created?.id === selectedClientId ? created : null);

  const q = norm(query);
  const matches = useMemo(
    () =>
      (q
        ? clients.filter(
            (c) =>
              norm(c.name).includes(q) ||
              (c.phone ?? "").includes(query.trim()),
          )
        : clients
      ).slice(0, 5),
    [clients, q, query],
  );
  const canCreate = q.length > 0 && !clients.some((c) => norm(c.name) === q);

  const pick = (c: ClientType) => {
    setSelectedClientId(c.id);
    setQuery("");
    setFocused(false);
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const c = await ClientsService.create({
        name: query.trim(),
        phone: "",
        notes: "",
      });
      setCreated(c);
      onClientCreated?.(c);
      pick(c);
    } catch {
      Alert.alert("Error", "No se pudo crear el cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (selected) {
    return (
      <View
        style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}
        className="mb-4 h-16 rounded-lg px-4 flex-row items-center justify-between"
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          <Ionicons name="person" size={18} color="#ff5722" />
          <Text style={{ color: C.text, fontSize: 17 }} numberOfLines={1}>
            {selected.name}
          </Text>
        </View>
        <Pressable onPress={() => setSelectedClientId("")} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={C.muted} />
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <View
        style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}
        className="h-16 rounded-lg px-4 flex-row items-center gap-2"
      >
        <Ionicons name="search-outline" size={18} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Buscar o crear cliente (opcional)"
          placeholderTextColor={C.muted}
          style={{ flex: 1, color: C.text, fontSize: 17 }}
        />
      </View>

      {focused && (
        <View
          style={{
            marginTop: 6,
            backgroundColor: C.sheet,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.line,
            overflow: "hidden",
          }}
        >
          {matches.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => pick(c)}
              style={{
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}
            >
              <Text style={{ color: C.text, fontWeight: "600" }}>{c.name}</Text>
              {!!c.phone && (
                <Text style={{ color: C.muted, fontSize: 14 }}>{c.phone}</Text>
              )}
            </Pressable>
          ))}
          {canCreate && (
            <Pressable
              onPress={handleCreate}
              disabled={isSaving}
              style={{
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#ff572215",
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ff5722" />
              ) : (
                <Ionicons name="person-add" size={16} color="#ff5722" />
              )}
              <Text style={{ color: "#ff5722", fontWeight: "700" }}>
                Crear y seleccionar «{query.trim()}»
              </Text>
            </Pressable>
          )}
          {!matches.length && !canCreate && (
            <Text style={{ color: C.faint, padding: 12 }}>Sin clientes</Text>
          )}
        </View>
      )}
    </View>
  );
}
