export type ProductType = {
  id: string;
  image_url?: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
  sincronizado?: 0 | 1;
  updated_at?: string;
};
