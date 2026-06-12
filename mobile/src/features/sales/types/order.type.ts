export type OrderType = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
  sincronizado?: 0 | 1;
  updated_at?: string;
};