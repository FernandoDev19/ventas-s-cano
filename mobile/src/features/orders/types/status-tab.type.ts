export const ORDER_STATUS_TAB = [
  "pending",
  "accepted",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type OrderStatusTabType = (typeof ORDER_STATUS_TAB)[number];
