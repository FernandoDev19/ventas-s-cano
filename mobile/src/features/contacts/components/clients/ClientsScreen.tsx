import { ActivityIndicator, View } from "react-native";
import { useClients } from "./hooks/useClients";
import { useClientsForm } from "./hooks/useClientsForm";
import ClientCreateEditModal from "./components/ClientCreateEditModal";
import ClientsList from "./components/ClientsList";
import HeaderTabs from "@/src/shared/components/HeaderTabs";

type Props = {
  onChangeTab: (tab: "clientes" | "proveedores") => void;
  activeTab: "clientes" | "proveedores";
};

export default function ClientsScreen({ onChangeTab, activeTab }: Props) {
  const {
    clients,
    isLoading,
    isRefreshing,
    loadData,
    setIsRefreshing,
    totalDebt,
    debtors,
  } = useClients();
  const {
    handleDelete,
    openEdit,
    resetForm,
    setShowCreate,
    setEditingClient,
    showCreate,
    editingClient,
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
  } = useClientsForm(loadData);

  if (isLoading)
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

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <HeaderTabs
        tabs={["clientes", "proveedores"]}
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />

      <ClientsList
        clients={clients}
        debtors={debtors}
        totalDebt={totalDebt}
        isRefreshing={isRefreshing}
        setIsRefreshing={setIsRefreshing}
        loadData={loadData}
        openEdit={openEdit}
        handleDelete={handleDelete}
      />

      <ClientCreateEditModal
        showCreate={showCreate}
        setShowCreate={setShowCreate}
        editingClient={editingClient}
        setEditingClient={setEditingClient}
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        email={email}
        setEmail={setEmail}
        notes={notes}
        setNotes={setNotes}
        isSaving={isSaving}
        handleSave={handleSave}
        resetForm={resetForm}
      />
    </View>
  );
}
