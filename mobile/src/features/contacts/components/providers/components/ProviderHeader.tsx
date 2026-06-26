import { Text, View } from "react-native";
import { ContactType } from "../../../types/contact.type";

type Props = {
  providers: ContactType[];
};

export default function ProviderHeader({ providers }: Props) {
  return (
    <View style={{ paddingTop: 16 }}>
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>
          Provedores
        </Text>
        <Text style={{ color: "#737373", fontSize: 14 }}>
          {providers.length} registrados
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          Lista de Provedores
        </Text>
      </View>
    </View>
  );
}
