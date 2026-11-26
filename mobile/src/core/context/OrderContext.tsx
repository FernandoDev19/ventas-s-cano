import { ProductType } from "@/src/features/inventory/types/product.type";
import { RecipeType } from "@/src/features/recipes/types/recipe.type";
import { createContext, useState } from "react";
import { useSettings } from "./SettingsContext";

// An order item is either a plain product OR a recipe (sold as a single dish)
export type OrderItem =
  | {
      type: "product";
      product: ProductType;
      quantity: number;
      customPrice?: number;
    }
  | {
      type: "recipe";
      recipe: RecipeType;
      quantity: number;
      customPrice?: number;
    };

export const originalPriceOf = (i: OrderItem) =>
  i.type === "product" ? i.product.price : i.recipe.selling_price;
export const unitPriceOf = (i: OrderItem) =>
  i.customPrice ?? originalPriceOf(i);

export type OrderContextType = {
  order: OrderItem[];
  addToOrder: (product: ProductType) => void;
  addRecipeToOrder: (recipe: RecipeType) => void;
  removeFromOrder: (id: string, itemType: "product" | "recipe") => void;
  clearOrder: () => void;
  setItemPrice: (
    id: string,
    itemType: "product" | "recipe",
    price: number | null,
  ) => void;
};

export const OrderContext = createContext<OrderContextType | undefined>(
  undefined,
);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const { allowNoStock } = useSettings();

  const addToOrder = (product: ProductType) => {
    setOrder((prev) => {
      const exists = prev.find(
        (i) => i.type === "product" && i.product.id === product.id,
      );
      if (exists) {
        return prev.map((item) =>
          item.type === "product" && item.product.id === product.id
            ? {
                ...item,
                quantity:
                  allowNoStock || item.quantity < product.stock
                    ? item.quantity + 1
                    : item.quantity,
              }
            : item,
        );
      }
      if (!allowNoStock && product.stock <= 0) return prev; // ← antes se agregaba igual
      return [...prev, { type: "product", product, quantity: 1 }];
    });
  };

  const addRecipeToOrder = (recipe: RecipeType) => {
    setOrder((prev) => {
      const exists = prev.find(
        (i) => i.type === "recipe" && i.recipe.id === recipe.id,
      );
      const max = recipe.maxUnits ?? Infinity;
      if (exists) {
        return prev.map((item) =>
          item.type === "recipe" && item.recipe.id === recipe.id
            ? {
                ...item,
                quantity:
                  allowNoStock || item.quantity < max
                    ? item.quantity + 1
                    : item.quantity,
              }
            : item,
        );
      }
      if (!allowNoStock && max < 1) return prev;
      return [...prev, { type: "recipe", recipe, quantity: 1 }];
    });
  };

  const removeFromOrder = (id: string, itemType: "product" | "recipe") => {
    setOrder((prev) => {
      const item = prev.find(
        (i) =>
          (itemType === "product" &&
            i.type === "product" &&
            i.product.id === id) ||
          (itemType === "recipe" && i.type === "recipe" && i.recipe.id === id),
      );
      if (item) {
        if (item.quantity > 1) {
          return prev.map((i) =>
            (itemType === "product" &&
              i.type === "product" &&
              i.product.id === id) ||
            (itemType === "recipe" && i.type === "recipe" && i.recipe.id === id)
              ? { ...i, quantity: i.quantity - 1 }
              : i,
          );
        } else {
          return prev.filter(
            (i) =>
              !(
                (itemType === "product" &&
                  i.type === "product" &&
                  i.product.id === id) ||
                (itemType === "recipe" &&
                  i.type === "recipe" &&
                  i.recipe.id === id)
              ),
          );
        }
      }
      return prev;
    });
  };

  const setItemPrice = (
    id: string,
    itemType: "product" | "recipe",
    price: number | null,
  ) => {
    setOrder((prev) =>
      prev.map((i) => {
        const match =
          (itemType === "product" &&
            i.type === "product" &&
            i.product.id === id) ||
          (itemType === "recipe" && i.type === "recipe" && i.recipe.id === id);
        return match
          ? { ...i, customPrice: price === null ? undefined : price }
          : i;
      }),
    );
  };

  const clearOrder = () => setOrder([]);

  return (
    <OrderContext.Provider
      value={{
        order,
        addToOrder,
        addRecipeToOrder,
        removeFromOrder,
        clearOrder,
        setItemPrice,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}
