import { supabase } from "@/src/core/config/supabase";
import { OrderPro } from "../types/order.type";

export const OrdersService = {
  getOrdersByStatus: async (status: string): Promise<OrderPro[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_name,
        customer_phone,
        delivery_type,
        delivery_address,
        comments,
        total_price,
        status,
        client_id,
        table_id,
        order_items (
          id,
          product_id,
          recipe_id,
          quantity,
          price_at_time,
          products ( name ),
          recipes ( name )
        )
      `,
      )
      .eq("status", status)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error jalando órdenes de Supabase:", error.message);
      return [];
    }
    return data as unknown as OrderPro[];
  },

  updateOrderStatus: async (
    orderId: string,
    newStatus: string,
    kitchen_status?: "unseen" | "pending" | "ready",
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, kitchen_status })
      .eq("id", orderId);

    if (error) throw error;
    return true;
  },

  createOrderFromMobile: async (orderData: any) => {
    // 1. Insertamos la cabecera de la orden
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: orderData.customer_name || "Caja Local",
        customer_phone: orderData.customer_phone || "", // ◄ ¡AQUÍ ESTÁ LA JUGADA! Si es null, manda un texto vacío
        delivery_address: orderData.delivery_address || "", // Por si las moscas también está NOT NULL
        total_price: orderData.total_price,
        comments: orderData.comments || "",
        status: orderData.status, // 'accepted'
        kitchen_status: "pending",
        delivery_type: orderData.delivery_type || "local",
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error al crear cabecera de orden:", orderError.message);
      throw orderError;
    }

    // 2. Preparamos los items amarrados al ID de la orden que nos devolvió Supabase
    const itemsToInsert = orderData.order_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      recipe_id: item.recipe_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
    }));

    // 3. Insertamos el detalle en la tabla intermedia
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error(
        "❌ Error al insertar items de la orden:",
        itemsError.message,
      );
      throw itemsError;
    }

    return true;
  },
};
