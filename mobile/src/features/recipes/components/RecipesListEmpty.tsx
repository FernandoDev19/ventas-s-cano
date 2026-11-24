// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { C } from "@/src/core/theme/palette";

type Props = {
  search?: string;
};

export default function RecipesListEmpty({ search }: Props) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: C.card,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Ionicons name="restaurant-outline" size={36} color="#444" />
      </View>
      <Text
        style={{
          color: C.text,
          fontSize: 20,
          fontWeight: "800",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {search ? `Sin resultados para "${search}"` : "No hay recetas creadas"}
      </Text>
      <Text style={{ color: C.muted, fontSize: 15, textAlign: "center" }}>
        {search
          ? "Prueba con otro nombre"
          : "Crea tu primera receta con el botón +"}
      </Text>
    </View>
  );
}
