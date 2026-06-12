import { ProductType } from "@/src/features/products/types/product.type";
import { RecipeType } from "@/src/features/recipes/types/recipe.type";
import { createContext, useState } from "react";

// An order item is either a plain product OR a recipe (sold as a single dish)
export type OrderItem =
  | { type: "product"; product: ProductType; quantity: number }
  | { type: "recipe"; recipe: RecipeType; quantity: number };

export type OrderContextType = {
  order: OrderItem[];
  addToOrder: (product: ProductType) => void;
  addRecipeToOrder: (recipe: RecipeType) => void;
  removeFromOrder: (id: string, itemType: "product" | "recipe") => void;
  clearOrder: () => void;
};

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [order, setOrder] = useState<OrderItem[]>([]);

  const addToOrder = (product: ProductType) => {
    setOrder((prev) => {
      const exists = prev.find(
        (item) => item.type === "product" && item.product.id === product.id
      );
      if (exists) {
        return prev.map((item) =>
          item.type === "product" && item.product.id === product.id
            ? { ...item, quantity: item.quantity < product.stock ? item.quantity + 1 : item.quantity }
            : item
        );
      }
      return [...prev, { type: "product", product, quantity: 1 }];
    });
  };

  const addRecipeToOrder = (recipe: RecipeType) => {
    setOrder((prev) => {
      const exists = prev.find(
        (item) => item.type === "recipe" && item.recipe.id === recipe.id
      );
      if (exists) {
        return prev.map((item) =>
          item.type === "recipe" && item.recipe.id === recipe.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { type: "recipe", recipe, quantity: 1 }];
    });
  };

  const removeFromOrder = (id: string, itemType: "product" | "recipe") => {
    setOrder((prev) => {
      const item = prev.find(
        (i) =>
          (itemType === "product" && i.type === "product" && i.product.id === id) ||
          (itemType === "recipe" && i.type === "recipe" && i.recipe.id === id)
      );
      if (item) {
        if (item.quantity > 1) {
          return prev.map((i) =>
            (itemType === "product" && i.type === "product" && i.product.id === id) ||
            (itemType === "recipe" && i.type === "recipe" && i.recipe.id === id)
              ? { ...i, quantity: i.quantity - 1 }
              : i
          );
        } else {
          return prev.filter(
            (i) => !(
              (itemType === "product" && i.type === "product" && i.product.id === id) ||
              (itemType === "recipe" && i.type === "recipe" && i.recipe.id === id)
            )
          );
        }
      }
      return prev;
    });
  };

  const clearOrder = () => setOrder([]);

  return (
    <OrderContext.Provider
      value={{ order, addToOrder, addRecipeToOrder, removeFromOrder, clearOrder }}
    >
      {children}
    </OrderContext.Provider>
  );
}
