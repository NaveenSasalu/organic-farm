"use client";
import { useCartStore } from "@/lib/store";
import { ShoppingBasket } from "lucide-react";

export default function CartCounter() {
  // Grab the items and the toggle function from the store
  const items = useCartStore((state) => state.items);
  const toggleDrawer = useCartStore((state) => state.toggleDrawer);

  const count = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <button
      onClick={toggleDrawer} // This is the crucial line!
      className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full font-bold hover:bg-stone-800 transition active:scale-95"
    >
      <ShoppingBasket size={18} />
      <span>Basket ({count})</span>
    </button>
  );
}
