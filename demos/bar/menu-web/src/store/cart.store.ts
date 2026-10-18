import { create } from "zustand";
import type { PlacedOrder } from "../types/order.type";

export type CartItem = {
  type: "product" | "recipe";
  id: string | number;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
  quantity: number;
};

type CartStore = {
  tableId: string;
  setTableId: (id: string) => void;

  isCartOpen: boolean;
  isConfirmationOpen: boolean;
  isCheckoutOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  openConfirmation: () => void;
  closeConfirmation: () => void;

  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string | number, type: CartItem["type"]) => void;
  resetCart: () => void;

  lastOrder: PlacedOrder | null;
  setLastOrder: (order: PlacedOrder | null) => void;
};

export const useCartStore = create<CartStore>()((set) => ({
  tableId: "caja",
  setTableId: (tableId) => set({ tableId }),

  isCartOpen: false,
  isConfirmationOpen: false,
  isCheckoutOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  openCheckout: () => set({ isCheckoutOpen: true }),
  closeCheckout: () => set({ isCheckoutOpen: false }),
  openConfirmation: () => set({ isConfirmationOpen: true }),
  closeConfirmation: () => set({ isConfirmationOpen: false }),

  items: [],

  addItem: (newItem) =>
    set((state) => {
      const exists = state.items.find(
        (i) => i.id === newItem.id && i.type === newItem.type,
      );

      if (exists) {
        return {
          items: state.items.map((i) =>
            i.id === newItem.id && i.type === newItem.type
              ? { ...i, quantity: i.quantity < newItem.stock ? i.quantity + 1 : i.quantity }
              : i,
          ),
        };
      }

      if (newItem.stock < 1) return { items: state.items };
      return { items: [...state.items, { ...newItem, quantity: 1 }] };
    }),

  removeItem: (id, type) =>
    set((state) => {
      const exists = state.items.find((i) => i.id === id && i.type === type);
      if (!exists) return { items: state.items };

      if (exists.quantity <= 1) {
        return { items: state.items.filter((i) => !(i.id === id && i.type === type)) };
      }
      return {
        items: state.items.map((i) =>
          i.id === id && i.type === type ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      };
    }),

  resetCart: () => set({ items: [] }),

  lastOrder: null,
  setLastOrder: (lastOrder) => set({ lastOrder }),
}));
