import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { MenuExtendedItem } from "../types/menu.type";
import { MenuService } from "../services/menu.service";

type Category = { id: string; name: string };

export const useMenu = () => {
  const [params] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.get("cat") ?? "all",
  );
  const [menuItems, setMenuItems] = useState<MenuExtendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    MenuService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const request =
      selectedCategory === "all"
        ? MenuService.getMenu()
        : MenuService.getMenuByCategory(selectedCategory);

    request
      .then((items) => {
        if (!cancelled) setMenuItems(items);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const query = searchQuery.trim().toLowerCase();
  const filteredItems = menuItems.filter(
    (item) =>
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query),
  );

  return {
    categories,
    loading,
    filteredItems,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
  };
};
