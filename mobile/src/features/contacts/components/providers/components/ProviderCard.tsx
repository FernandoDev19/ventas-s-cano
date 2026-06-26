import { Pressable, Text, View } from "react-native";
import { ContactType } from "../../../types/contact.type";

type Props = {
  item: ContactType;
  openEdit: (provider: ContactType) => void;
  handleDelete: (provider: ContactType) => void;
};

export default function ProviderCard({ item, openEdit, handleDelete }: Props) {
  return (
    <Pressable
      onPress={() => openEdit(item)}
      onLongPress={() => handleDelete(item)}
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 14,
        backgroundColor: "#1a1a1a",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#2a2a2a",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#ff572222",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#ff5722",
            fontWeight: "900",
            fontSize: 18,
          }}
        >
          {item.name[0].toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          {item.name}
        </Text>
        {item.phone ? (
          <Text style={{ color: "#737373", fontSize: 12 }}>{item.phone}</Text>
        ) : null}
        {item.email ? (
          <Text style={{ color: "#737373", fontSize: 12 }}>{item.email}</Text>
        ) : null}
        {item.notes && (
          <Text style={{ color: "#737373", fontSize: 12 }}>{item.notes}</Text>
        )}
      </View>
    </Pressable>
  );
}
