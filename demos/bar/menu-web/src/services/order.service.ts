import type { OrderCheckoutType, PlacedOrder } from "../types/order.type";

const delay = (ms = 700) => new Promise((res) => setTimeout(res, ms));

export const OrderService = {
  /** Simula el envío de un pedido. Aquí iría la llamada real al backend. */
  async createOrder(
    data: OrderCheckoutType,
    tableId: string,
  ): Promise<PlacedOrder> {
    await delay();
    return {
      id: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      tableId,
      total: data.items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      data,
    };
  },
};
