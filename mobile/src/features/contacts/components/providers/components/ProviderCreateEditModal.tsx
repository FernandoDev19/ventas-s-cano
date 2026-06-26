import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  showCreate: boolean;
  setShowCreate: (show: boolean) => void;
  editingProvider: any;
  setEditingProvider: (provider: any) => void;
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  email: string;
  setEmail: (email: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  isSaving: boolean;
  handleSave: () => void;
  resetForm: () => void;
};

export default function ProviderCreateEditModal({
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
  handleSave,
  resetForm,
}: Props) {
  return (
    <>
      <Pressable
        onPress={() => {
          resetForm();
          setEditingProvider(null);
          setShowCreate(true);
        }}
        style={{
          position: "absolute",
          bottom: 28,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#ff5722",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Modal crear/editar */}
      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreate(false)}
      >
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
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
                {editingProvider ? "Editar Provedor" : "Nuevo Provedor"}
              </Text>
              <Pressable
                onPress={() => setShowCreate(false)}
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>

            {[
              {
                label: "Nombre",
                value: name,
                setter: setName,
                placeholder: "Ej. Carlos Pérez",
                keyboard: "default",
              },
              {
                label: "Teléfono (opcional)",
                value: phone,
                setter: setPhone,
                placeholder: "Ej. 3001234567",
                keyboard: "phone-pad",
              },
              {
                label: "Email (opcional)",
                value: email,
                setter: setEmail,
                placeholder: "Ej. [EMAIL_ADDRESS]",
                keyboard: "email-address",
              },
              {
                label: "Notas (opcional)",
                value: notes,
                setter: setNotes,
                placeholder: "Ej. Vecino del barrio",
                keyboard: "default",
              },
            ].map((field) => (
              <View key={field.label} style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  {field.label}
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
              style={{
                backgroundColor: "#ff5722",
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                opacity: isSaving ? 0.7 : 1,
                marginTop: 8,
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}
                >
                  Guardar
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
