import { ActivityIndicator, View } from "react-native";
import { useClients } from "./hooks/useClients";
import { useClientsForm } from "./hooks/useClientsForm";
import ClientCreateEditModal from "./components/ClientCreateEditModal";
import ClientsList from "./components/ClientsList";

export default function ClientsScreen() {
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
        notes={notes}
        setNotes={setNotes}
        isSaving={isSaving}
        handleSave={handleSave}
        resetForm={resetForm}
      />
    </View>
  );
}
