import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import ClientCard from "./ClientCard";
import ClientsHeader from "./ClientsHeader";

type Props = {
  clients: any[];
  debtors: any[];
  totalDebt: number;
  isRefreshing: boolean;
  setIsRefreshing: (isRefreshing: boolean) => void;
  loadData: (isRefreshing: boolean) => void;
  openEdit: (client: any) => void;
  handleDelete: (client: any) => void;
};

export default function ClientsList({
  clients,
  debtors,
  totalDebt,
  isRefreshing,
  setIsRefreshing,
  loadData,
  openEdit,
  handleDelete,
}: Props) {
  return (
    <FlatList
      data={clients}
      keyExtractor={(c) => String(c.id)}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            loadData(true);
          }}
          tintColor="#ff5722"
        />
      }
      ListHeaderComponent={
        <ClientsHeader
          clients={clients}
          debtors={debtors}
          totalDebt={totalDebt}
        />
      }
      renderItem={({ item }) => (
        <ClientCard
          item={item}
          openEdit={openEdit}
          handleDelete={handleDelete}
        />
      )}
      ListEmptyComponent={
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 80,
          }}
        >
          <Ionicons name="people-outline" size={48} color="#333" />
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: 18,
              marginTop: 16,
            }}
          >
            Sin clientes
          </Text>
          <Text style={{ color: "#737373", fontSize: 14, marginTop: 4 }}>
            Agrega tu primer cliente
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
}
