export interface OrderItemDetail {
  id: string;
  quantity: number;
  price_at_time: number;
  product_id?: string | null;
  recipe_id?: string | null;
  products?: { name: string } | null;
  recipes?: { name: string } | null;
}

export interface OrderPro {
  id: string;
  client_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_type: "domicilio" | "local" | "mesa";
  delivery_address: string | null;
  comments: string | null;
  total_price: number;
  status: "pending" | "accepted" | "ready" | "delivered" | "cancelled";
  created_at: string;
  table_id: number | null;
  origin: "caja" | "qr_cliente";
  order_items: OrderItemDetail[];
}