export interface MenuCombinedItem {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  category_id: string | number;
  is_recipe: boolean;
}

export type MenuExtendedItem = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  stock: number;
  category_id: string;
  is_recipe: boolean;
};
