import { useState } from "react";
import ClientsScreen from "./components/clients/ClientsScreen";
import ProvidersScreen from "./components/providers/ProvidersScreen";

const ContactsScreen = () => {
  const [activeTab, setActiveTab] = useState<"clientes" | "proveedores">(
    "clientes",
  );

  if (activeTab === "clientes") {
    return <ClientsScreen onChangeTab={setActiveTab} activeTab={activeTab} />;
  }

  return <ProvidersScreen onChangeTab={setActiveTab} activeGTab={activeTab} />;
};

export default ContactsScreen;
