import { supabase } from "../lib/supabase";
import type { OrderCheckoutType } from "../types/order.type";

export const CheckoutService = {
  createOrder: async (data: OrderCheckoutType, tableId?: string) => {
    try {
      const totalPedido = data.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );
      let clientId: string | null = null;

      // 1. BUSCAR O CREAR AL CLIENTE EN SUPABASE
      const { data: existingClient, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", data.celular)
        .maybeSingle();

      if (clientError) throw clientError;

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: createError } = await supabase
          .from("clients")
          .insert([
            {
              id: window.crypto.randomUUID(),
              name: data.nombre,
              phone: data.celular,
              notes: data.direccion
            },
          ])
          .select("id")
          .single();

        if (createError) throw createError;
        clientId = newClient.id;
      }

      const isQR = tableId !== "caja";

      // 2. CREAR LA ORDEN PRINCIPAL
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
{
            client_id: clientId,
            customer_name: data.nombre,
            customer_phone: data.celular,
            delivery_type: isQR ? "mesa" : data.tipoEntrega,
            delivery_address: data.tipoEntrega === "domicilio" && !isQR ? data.direccion : null,
            comments: data.comentarios,
            total_price: totalPedido,
            status: "pending",
            table_id: isQR ? Number(tableId) : null,
            origin: isQR ? "qr_cliente" : "caja",
          },
        ])
        .select("id")
        .single();

      if (orderError) throw orderError;

      // 3. REGISTRAR LOS PRODUCTOS DETALLADOS DE LA ORDEN
      const orderItemsPayload = data.items.map((item) => ({
        order_id: order.id,
        product_id: !item.is_recipe ? item.id : null,
        recipe_id: item.is_recipe ? item.id : null,
        quantity: item.quantity,
        price_at_time: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);

      if (itemsError) throw itemsError;

      return { success: true, orderId: order.id };
    } catch (error) {
      console.error("Chicharrón procesando el pedido en la web:", error);
      return { success: false, error };
    }
  },
};
