export interface OrderCheckoutType {
  nombre: string;
  celular: string;
  tipoEntrega: "domicilio" | "local";
  direccion?: string;
  comentarios?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    is_recipe: boolean;
  }>;
}