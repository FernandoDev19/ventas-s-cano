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
    cashier_status?: "pending" | "accepted" | "rejected",
  ) => {
    const updatePayload: Record<string, any> = { status: newStatus };
    if (kitchen_status !== undefined)
      updatePayload.kitchen_status = kitchen_status;
    if (cashier_status !== undefined)
      updatePayload.cashier_status = cashier_status;

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (error) throw error;
    return true;
  },

  createOrderFromMobile: async (orderData: any) => {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: orderData.customer_name || "Caja Local",
        customer_phone: orderData.customer_phone || "",
        delivery_address: orderData.delivery_address || "",
        total_price: orderData.total_price,
        comments: orderData.comments || "",
        status: orderData.status,
        kitchen_status: "pending",
        cashier_status: "accepted",
        delivery_type: orderData.delivery_type || "local",
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error al crear cabecera de orden:", orderError.message);
      throw orderError;
    }

    const itemsToInsert = orderData.order_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      recipe_id: item.recipe_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
    }));

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

    return order.id;
  },
};
