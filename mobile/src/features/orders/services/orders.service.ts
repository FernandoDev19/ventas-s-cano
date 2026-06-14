import { supabase } from "@/src/core/config/supabase";
import { OrderPro } from "../types/order.type";

export const OrdersService = {
getOrdersByStatus: async (status: string): Promise<OrderPro[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_id,
          recipe_id,
          quantity,
          price_at_time,
          products ( name ),
          recipes ( name )
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error jalando órdenes de Supabase:", error.message);
      return [];
    }
    return data as unknown as OrderPro[];
  },

  updateOrderStatus: async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) throw error;
    return true;
  }
};