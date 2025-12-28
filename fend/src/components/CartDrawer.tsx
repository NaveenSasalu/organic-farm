"use client";
import { useCartStore } from "@/lib/store";
import { X, Trash2, ShoppingBag } from "lucide-react";
// Inside CartDrawer.tsx
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const { items, isDrawerOpen, toggleDrawer, removeItem, totalPrice } =
    useCartStore();

  // ... inside the component
  const router = useRouter();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={toggleDrawer}
      />

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            Your Basket <ShoppingBag className="text-green-700" />
          </h2>
          <button
            onClick={toggleDrawer}
            className="p-2 hover:bg-stone-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-400">Your basket is empty.</p>
              <button
                onClick={toggleDrawer}
                className="mt-4 text-green-700 font-bold underline"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-stone-100 rounded-xl overflow-hidden shrink-0">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-800">{item.name}</h4>
                  <p className="text-sm text-stone-500">
                    {item.quantity} x ₹{item.price}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-stone-300 hover:text-red-500 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-stone-100 bg-stone-50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-stone-500 font-medium">Subtotal</span>
              <span className="text-2xl font-black text-stone-900">
                ₹{totalPrice()}
              </span>
            </div>
            <button
              onClick={() => {
                toggleDrawer();
                router.push("/checkout");
              }}
              className="w-full bg-green-800 text-white py-4 rounded-2xl font-bold ..."
            >
              Checkout Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
