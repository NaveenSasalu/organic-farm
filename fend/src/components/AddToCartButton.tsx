"use client"; // This tells Next.js this part is interactive

import { useCartStore } from "@/lib/store";

export default function AddToCartButton({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button
      onClick={() => addItem(product)}
      className="bg-green-800 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-100"
    >
      <span className="text-2xl font-light">+</span>
    </button>
  );
}
