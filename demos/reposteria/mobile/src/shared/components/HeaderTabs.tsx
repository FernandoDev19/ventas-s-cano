import { Text, TouchableOpacity, View } from "react-native";

const TAB_TRANSLATIONS: Record<string, string> = {
  pending: "Pendientes",
  accepted: "Aceptados",
  preparing: "Preparando",
  ready: "Listos",
  delivered: "Entregados",
  cancelled: "Cancelados",
  menu: "Menú",
  tables: "Mesas",
};

type Props<T> = {
  tabs: T[];
  activeTab: T;
  onChangeTab: (tab: T) => void;
};

export default function HeaderTabs<T>({ tabs, activeTab, onChangeTab }: Props<T>) {
  return (
    <View className="flex-row bg-background border-b border-neutral-800">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={String(tab)}
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === tab ? "border-orange-500" : "border-transparent"
          }`}
          onPress={() => onChangeTab(tab)}
        >
          <Text
            className={`font-bold text-xs uppercase tracking-wider ${
              activeTab === tab ? "text-orange-600" : "text-neutral-400"
            }`}
          >
            {TAB_TRANSLATIONS[String(tab)] || String(tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
