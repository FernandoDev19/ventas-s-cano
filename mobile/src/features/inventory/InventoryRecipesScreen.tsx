import { useState } from "react";
import InventoryScreen from "./components/InventoryScreen";
import RecipesScreen from "../recipes/RecipesScreen";

export default function InventoryRecipesScreen() {
    const [activeTab, setActiveTab] = useState<"productos" | "recetas">("productos");

  if (activeTab === "productos") {
    return <InventoryScreen activeTab={activeTab} onChangeTab={setActiveTab} />;
  }

  return <RecipesScreen activeTab={activeTab} onChangeTab={setActiveTab} />;
}