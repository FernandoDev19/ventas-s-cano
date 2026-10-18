import { useCallback, useEffect, useState } from "react";
import { MenuService, type MenuExtendedItem } from "../services/menu.service";
import { useCartStore } from "../store/cart.store";
import { useParams } from "react-router-dom";

export const useMenu = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [menuItems, setMenuItems] = useState<MenuExtendedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para el buscador
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Estado para saber si el local está abierto internamente
  const [isOpenNow, setIsOpenNow] = useState(true);

  // 2. Extraemos de Zustand de forma reactiva y consistente
  const { isCartOpen, openCart, isConfirmationOpen, items, isCheckoutOpen } =
    useCartStore();

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    const checkOpenStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      // Abierto desde las 15:00 (3 PM) hasta las 23:59 (Cierra a las 12 AM)
      setIsOpenNow(hour >= 15 && hour < 24);
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000); // Revisa cada minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    MenuService.getCategories().then((res) => {
      setCategories(res);
    });
  }, []);

  const fetchMenu = useCallback(() => {
    return selectedCategory === "all"
      ? MenuService.getMenu()
      : MenuService.getMenuByCategory(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);

    fetchMenu()
      .then((items) => {
        setMenuItems(items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, fetchMenu]);

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return {
    tableId: tableId || "caja",
    categories,
    loading,
    filteredItems,
    isOpenNow,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    totalItems,
    isCartOpen,
    isConfirmationOpen,
    isCheckoutOpen,
    openCart,
    totalPrice,
    fetchMenu,
  };
};
