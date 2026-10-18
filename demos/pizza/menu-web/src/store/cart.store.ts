import { create } from "zustand";

// Definimos el tipo de ítem unificado para el carrito (sacado de tu lógica de mobile)
export type CartItem =
  | { type: "product"; id: string | number; name: string; price: number; stock: number; image_url?: string; quantity: number }
  | { type: "recipe"; id: string | number; name: string; price: number; stock: number; image_url?: string; quantity: number };

type CartStore = {
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
  removeItem: (id: string | number, type: "product" | "recipe") => void;
  resetCart: () => void;
}

export const useCartStore = create<CartStore>()((set) => ({
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
      // Buscamos si ya existe el mismo ítem con el mismo ID y Tipo
      const exists = state.items.find(
        (i) => i.id === newItem.id && i.type === newItem.type
      );

      if (exists) {
        return {
          items: state.items.map((i) =>
            i.id === newItem.id && i.type === newItem.type
              ? { 
                  ...i, 
                  // Controlamos el stock: si es producto respeta el límite, si es receta sube normal
                  quantity: i.quantity < newItem.stock ? i.quantity + 1 : i.quantity 
                }
              : i
          ),
        };
      }

      // Si no existe, lo agregamos con cantidad 1
      return {
        items: [...state.items, { ...newItem, quantity: 1 } as CartItem],
      };
    }),

  removeItem: (id, type) =>
    set((state) => {
      const exists = state.items.find((i) => i.id === id && i.type === type);
      if (!exists) return { items: state.items };

      // Si la cantidad es 1, lo borramos del mapa
      if (exists.quantity === 1) {
        return {
          items: state.items.filter((i) => !(i.id === id && i.type === type)),
        };
      }

      // Si es mayor a 1, le restamos uno
      return {
        items: state.items.map((i) =>
          i.id === id && i.type === type ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    }),

  resetCart: () => set({ items: [] }),
}));