import { Ionicons } from "@expo/vector-icons";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { ContactType } from "../../../types/contact.type";

type Props = {
  setSelectedClientId: (id: string) => void;
  selectedClientId: string | null;
  clients: ContactType[];
};

export default function ClientPicker({
  setSelectedClientId,
  selectedClientId,
  clients,
}: Props) {
  const [showClientPicker, setShowClientPicker] = useState(false);

  return (
    <>
      <View className="mb-4">
        <Pressable
          onPress={() => setShowClientPicker(true)}
          className="h-16 bg-neutral-800 shadow-lg rounded-lg px-4 flex-row items-center gap-2"
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={selectedClientId ? "#ff5722" : "#737373"}
            />
            <Text
              style={{
                color: selectedClientId ? "#fff" : "#737373",
                fontSize: 15,
              }}
            >
              {selectedClientId
                ? clients.find((c) => c.id === selectedClientId)?.name
                : "Asignar cliente (opcional)"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#555" />
        </Pressable>
      </View>

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
              maxHeight: "60%",
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                Seleccionar Cliente
              </Text>
              <Pressable
                onPress={() => setShowClientPicker(false)}
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
            <FlatList
              data={clients}
              keyExtractor={(c) => String(c.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedClientId(item.id);
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
                  <View>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {item.name}
                    </Text>
                    {item.phone && (
                      <Text style={{ color: "#737373", fontSize: 12 }}>
                        {item.phone}
                      </Text>
                    )}
                    {item.email && (
                      <Text style={{ color: "#737373", fontSize: 12 }}>
                        {item.email}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text
                  style={{
                    color: "#555",
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  No hay clientes registrados
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
