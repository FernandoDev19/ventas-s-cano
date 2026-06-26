import { ActivityIndicator, View } from "react-native";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import { useProviders } from "./hooks/useProviders";
import ProvidersList from "./components/ProvidersList";
import ProviderCreateEditModal from "./components/ProviderCreateEditModal";
import { useProvidersForm } from "./hooks/useProvidersForm";

type Props = {
  onChangeTab: (tab: "clientes" | "proveedores") => void;
  activeGTab: "clientes" | "proveedores";
};

export default function ProvidersScreen({ onChangeTab, activeGTab }: Props) {
  const {
    providers,
    isLoading,
    isRefreshing,
    loadData,
    setIsRefreshing,
  } = useProviders();
  const {
    handleDelete,
    openEdit,
    resetForm,
    setShowCreate,
    setEditingProvider,
    showCreate,
    editingProvider,
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
  } = useProvidersForm(loadData);

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
        activeTab={activeGTab}
        onChangeTab={onChangeTab}
      />
      
      <ProvidersList
        providers={providers}
        isRefreshing={isRefreshing}
        setIsRefreshing={setIsRefreshing}
        loadData={loadData}
        openEdit={openEdit}
        handleDelete={handleDelete}
      />

      <ProviderCreateEditModal
        showCreate={showCreate}
        setShowCreate={setShowCreate}
        editingProvider={editingProvider}
        setEditingProvider={setEditingProvider}
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
