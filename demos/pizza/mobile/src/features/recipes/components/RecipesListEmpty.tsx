import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

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
          backgroundColor: "#1a1a1a",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Ionicons name="restaurant-outline" size={36} color="#444" />
      </View>
      <Text
        style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: "800",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {search ? `Sin resultados para "${search}"` : "No hay recetas creadas"}
      </Text>
      <Text style={{ color: "#737373", fontSize: 13, textAlign: "center" }}>
        {search
          ? "Prueba con otro nombre"
          : "Crea tu primera receta con el botón +"}
      </Text>
    </View>
  );
}
