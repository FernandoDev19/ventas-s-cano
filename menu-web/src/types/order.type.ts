export interface OrderCheckoutType {
  nombre: string;
  celular: string;
  tipoEntrega: "comer_aqui" | "para_llevar" | "domicilio" | "local" | "mesa";
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