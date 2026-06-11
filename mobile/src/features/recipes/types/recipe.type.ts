export type RecipeIngredientType = {
  id?: number;
  recipe_id?: number;
  product_id: number;
  product_name?: string;
  product_image?: string;
  quantity: number;
};

export type RecipeType = {
  id?: number;
  name: string;
  description?: string;
  image_url?: string;
  selling_price: number;
  category_id?: number | null;
  ingredients?: RecipeIngredientType[];
  // Calculated field: true if all ingredients have enough stock
  canPrepare?: boolean;
};
