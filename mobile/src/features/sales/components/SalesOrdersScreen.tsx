import React, { useState } from "react";
import SalesScreen from "./SalesScreen";
import OrdersScreen from "../../orders/components/OrdersScreen";

interface SalesOrdersScreenProps {
  initialTab?: "Ventas" | "Ordenes";
}

export default function SalesOrdersScreen({ initialTab }: SalesOrdersScreenProps) {
  const [activeTab, setActiveTab] = useState<"Ventas" | "Ordenes">(
    initialTab || "Ventas"
  );

  if (activeTab === "Ventas") {
    return <SalesScreen onChangeTab={setActiveTab} activeTab={activeTab} />;
  }

  return <OrdersScreen onChangeTab={setActiveTab} activeGTab={activeTab} />;
}
