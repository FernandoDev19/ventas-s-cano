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