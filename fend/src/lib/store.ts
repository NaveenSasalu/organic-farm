import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      toggleDrawer: () => set({ isDrawerOpen: !get().isDrawerOpen }),

      addItem: (product: Product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          const cartItem: CartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image_url: product.image_url || undefined,
            unit: product.unit,
          };
          set({ items: [...currentItems, cartItem] });
        }
      },

      removeItem: (id: number) =>
        set({ items: get().items.filter((item) => item.id !== id) }),

      updateQuantity: (id: number, quantity: number) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.id !== id) });
        } else {
          set({
            items: get().items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      totalPrice: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),

      itemCount: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),
    }),
    { name: "farm-cart-storage" }
  )
);
