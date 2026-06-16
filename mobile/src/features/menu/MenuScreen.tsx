import ProductList from "@/src/features/menu/components/ProductList";
import { useMenu } from "@/src/features/menu/hooks/useMenu";
import QrCode from "./components/qr-code/QrCode";
import { View } from "react-native";

const MenuScreen = () => {
  const { filter, categories, setFilter } = useMenu();

  return (
    <View className="flex-1 bg-background">
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
