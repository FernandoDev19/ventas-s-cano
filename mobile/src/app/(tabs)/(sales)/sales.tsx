import SalesOrdersScreen from "@/src/features/sales/SalesOrdersScreen";
import { useLocalSearchParams } from "expo-router";

export default function SalesTab() {
  const { tab } = useLocalSearchParams<{ tab: "Ventas" | "Ordenes" }>();

  return <SalesOrdersScreen initialTab={tab} />;
}
