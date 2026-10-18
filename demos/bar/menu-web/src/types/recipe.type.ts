export type RecipeIngredientType = {
  id?: string;
  recipe_id?: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  quantity: number;
  updated_at?: string;
};

export type RecipeType = {
  id?: string;
  name: string;
  description?: string;
  image_url?: string;
  selling_price: number;
  category_id?: string | null;
  ingredients?: RecipeIngredientType[];
  stock: number;
  updated_at?: string;
};
