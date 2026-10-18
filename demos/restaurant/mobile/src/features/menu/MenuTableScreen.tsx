import React, { useState } from "react";
import MenuScreen from "./components/MenuScreen";
import TablesScreen from "../tables/TablesScreen";

const MenuTableScreen = () => {
  const [activeTab, setActiveTab] = useState<"menu" | "tables">("menu");

  if (activeTab === "menu") {
    return <MenuScreen onChangeTab={setActiveTab} activeTab={activeTab} />;
  }

  return <TablesScreen onChangeTab={setActiveTab} activeGTab={activeTab} />;
};

export default MenuTableScreen;
