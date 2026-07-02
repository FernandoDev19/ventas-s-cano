import ProductList from "@/src/features/menu/components/ProductList";
import { useMenu } from "@/src/features/menu/hooks/useMenu";
import QrCode from "./qr-code/QrCode";
import { ActivityIndicator, View } from "react-native";
import HeaderTabs from "@/src/shared/components/HeaderTabs";
import { useUserRole } from "@/src/shared/hooks/useUserRole";

type Props = {
  onChangeTab: (tab: "menu" | "tables") => void;
  activeTab: "menu" | "tables";
};

const MenuScreen = ({ onChangeTab, activeTab }: Props) => {
  const { filter, categories, setFilter } = useMenu();
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <View className="flex-1 bg-[#141414] justify-center items-center">
        <ActivityIndicator size="small" color="#ff5722" />
      </View>
    );
  }
  return (
    <View className="flex-1 bg-background">
      {role !== "kitchen" && (
        <HeaderTabs
          tabs={["menu", "tables"]}
          activeTab={activeTab}
          onChangeTab={onChangeTab}
        />
      )}
      <QrCode />
      <ProductList
        categories={categories}
        filter={filter}
        setFilter={setFilter}
      />
    </View>
  );
};

export default MenuScreen;
