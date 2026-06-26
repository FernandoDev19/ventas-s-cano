import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import ProviderHeader from "./ProviderHeader";
import ProviderCard from "./ProviderCard";

type Props = {
  providers: any[];
  isRefreshing: boolean;
  setIsRefreshing: (isRefreshing: boolean) => void;
  loadData: (isRefreshing: boolean) => void;
  openEdit: (provider: any) => void;
  handleDelete: (provider: any) => void;
};

export default function ProvidersList({
  providers,
  isRefreshing,
  setIsRefreshing,
  loadData,
  openEdit,
  handleDelete,
}: Props) {
  return (
    <FlatList
      data={providers}
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
        <ProviderHeader
          providers={providers}
        />
      }
      renderItem={({ item }) => (
        <ProviderCard
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
            Sin proveedores
          </Text>
          <Text style={{ color: "#737373", fontSize: 14, marginTop: 4 }}>
            Agrega tu primer proveedor
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
}
