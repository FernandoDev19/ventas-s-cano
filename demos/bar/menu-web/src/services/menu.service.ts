import type { MenuExtendedItem } from "../types/menu.type";
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from "./mock-data";

export type { MenuExtendedItem };

// Simula latencia de red para que la demo se sienta realista
const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

export const MenuService = {
  async getMenuByCategory(categoryId: string): Promise<MenuExtendedItem[]> {
    await delay();
    return MOCK_MENU_ITEMS.filter((item) => item.category_id === categoryId);
  },

  async getMenu(): Promise<MenuExtendedItem[]> {
    await delay();
    return MOCK_MENU_ITEMS;
  },

  async getCategories(): Promise<{ id: string; name: string }[]> {
    await delay(150);
    return MOCK_CATEGORIES;
  },
};
