import { ProductType } from "@/src/features/products/types/product.type";
import { createContext, useState } from "react";

export type OrderItem = { product: ProductType; quantity: number };

export type OrderContextType = {
  order: OrderItem[];
  addToOrder: (product: ProductType) => void;
  removeFromOrder: (productId: number) => void;
  clearOrder: () => void;
};

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [order, setOrder] = useState<OrderItem[]>([]);

  const addToOrder = (product: ProductType) => {
    setOrder((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity < product.stock ? item.quantity + 1 : item.quantity }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromOrder = (productId: number) => {
    setOrder((prev) => {
      const item = prev.find((item) => item.product.id === productId);
      if (item) {
        if (item.quantity > 1) {
          return prev.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          );
        } else {
          return prev.filter((item) => item.product.id !== productId);
        }
      }
      return prev;
    });
  };

  const clearOrder = () => {
    setOrder([]);
  };

  return (
    <OrderContext.Provider
      value={{ order, addToOrder, removeFromOrder, clearOrder }}
    >
      {children}
    </OrderContext.Provider>
  );
}
