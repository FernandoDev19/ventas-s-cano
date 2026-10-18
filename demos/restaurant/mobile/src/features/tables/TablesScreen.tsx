import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from "react-native";
import { useTables } from "./hooks/useTables";
import { Ionicons } from "@expo/vector-icons";
import { TableType } from "./services/tables.service";
import HeaderTabs from "@/src/shared/components/HeaderTabs";

type Props = {
  onChangeTab: (tab: "menu" | "tables") => void;
  activeGTab: "menu" | "tables";
};

export default function TablesScreen({ onChangeTab, activeGTab }: Props) {
  const {
    tables,
    isLoading,
    loadTables,
    occupy,
    release,
  } = useTables();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f0f",
        }}
      >
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  // Estadísticas
  const libres = tables.filter((t) => t.status === "libre").length;
  const ocupadas = tables.filter((t) => t.status === "ocupada").length;

  const handleTablePress = (table: TableType) => {
    if (table.status === "libre") {
      Alert.alert(
        "Ocupar Mesa",
        `¿Cliente se sienta en Mesa ${table.number_mesa}?`,
        [
          {
            text: "Sí, ocupar",
            style: "default",
            onPress: async () => {
              await occupy(table.id);
              loadTables(true);
            },
          },
          {
            text: "Cancelar",
            style: "cancel",
          },
        ]
      );
    } else if (table.status === "ocupada") {
      Alert.alert(
        "Mesa Ocupada",
        `Mesa ${table.number_mesa} - ¿Cliente ya pagó?`,
        [
          {
            text: "Sí, liberar",
            style: "destructive",
            onPress: async () => {
              await release(table.id);
              loadTables(true);
            },
          },
          {
            text: "Aún está aquí",
            style: "cancel",
          },
        ]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      {/* Tabs */}
      <HeaderTabs
        tabs={["menu", "tables"]}
        activeTab={activeGTab}
        onChangeTab={onChangeTab}
      />

      {/* Contenido */}
      <FlatList
        data={tables}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => loadTables(true)}
            tintColor="#ff5722"
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 }}>
            {/* Título */}
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>
              Mesas
            </Text>
            <Text style={{ fontSize: 13, color: "#737373", marginTop: 4 }}>
              {libres} libres · {ocupadas} ocupadas de {tables.length}
            </Text>

            {/* Stats Bar */}
            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: "#1a1a1a",
                  borderRadius: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: "#22c55e",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#22c55e" }}>
                  {libres}
                </Text>
                <Text style={{ fontSize: 10, color: "#737373", marginTop: 2 }}>
                  Libres
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: "#1a1a1a",
                  borderRadius: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: "#3b82f6",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#3b82f6" }}>
                  {ocupadas}
                </Text>
                <Text style={{ fontSize: 10, color: "#737373", marginTop: 2 }}>
                  Ocupadas
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: "#1a1a1a",
                  borderRadius: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: "#ff5722",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#ff5722" }}>
                  {tables.length}
                </Text>
                <Text style={{ fontSize: 10, color: "#737373", marginTop: 2 }}>
                  Total
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleTablePress(item)}
            style={{
              paddingVertical: 18,
              paddingHorizontal: 14,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor:
                item.status === "libre" ? "#22c55e22" : "#3b82f622",
              borderWidth: 2,
              borderColor:
                item.status === "libre" ? "#22c55e" : "#3b82f6",
            }}
          >
            {/* Número de Mesa */}
            <Text style={{ fontSize: 32, fontWeight: "900", color: "#fff" }}>
              {item.number_mesa}
            </Text>

            {/* Icono */}
            <Ionicons
              name={item.status === "libre" ? "checkmark-circle" : "people"}
              size={22}
              color={item.status === "libre" ? "#22c55e" : "#3b82f6"}
              style={{ marginTop: 6 }}
            />

            {/* Estado */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: item.status === "libre" ? "#22c55e" : "#3b82f6",
                marginTop: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {item.status === "libre" ? "Libre" : "Ocupada"}
            </Text>
          </Pressable>
        )}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          gap: 12,
        }}
        columnWrapperStyle={{ gap: 12 }}
        scrollEnabled={true}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 80,
            }}
          >
            <Ionicons name="restaurant-outline" size={48} color="#333" />
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 18,
                marginTop: 16,
              }}
            >
              Sin mesas
            </Text>
            <Text style={{ color: "#737373", fontSize: 12, marginTop: 4 }}>
              Las mesas se cargan al iniciar la app
            </Text>
          </View>
        }
      />
    </View>
  );
}