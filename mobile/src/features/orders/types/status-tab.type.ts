export const ORDER_STATUS_TAB = [
  "pending",
  "accepted",
  "completed",
] as const;

export type OrderStatusTabType = (typeof ORDER_STATUS_TAB)[number];