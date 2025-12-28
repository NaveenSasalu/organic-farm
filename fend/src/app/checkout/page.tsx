"use client";
import { useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ArrowLeft, Truck } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderPayload = {
      customer_name: (e.target as any)[0].value,
      customer_email: (e.target as any)[1].value,
      address: (e.target as any)[2].value,
      total_price: totalPrice(),
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        alert("🌱 Order placed! We'll start picking your veggies.");
        clearCart();
        router.push("/");
      }
    } catch (err) {
      alert("Farm server error. Please try again later.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <h2 className="text-2xl font-bold">Your basket is empty</h2>
        <Link href="/" className="mt-4 text-green-700 underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Delivery Details Form */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-400 mb-6 hover:text-stone-600"
          >
            <ArrowLeft size={16} /> Back to shop
          </Link>
          <h2 className="text-3xl font-black text-stone-900 mb-6">
            Delivery Details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              required
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
            />
            <textarea
              placeholder="Delivery Address (in Bengaluru)"
              required
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none h-32"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-green-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              Confirm Order <Truck size={20} />
            </button>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-stone-800">Order Summary</h2>
          <div className="bg-white p-6 rounded-3xl border border-stone-200 divide-y divide-stone-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 flex justify-between">
                <div>
                  <p className="font-bold text-stone-800">{item.name}</p>
                  <p className="text-sm text-stone-500">
                    {item.quantity} x ₹{item.price}
                  </p>
                </div>
                <p className="font-bold">₹{item.price * item.quantity}</p>
              </div>
            ))}
            <div className="pt-6 flex justify-between items-center">
              <span className="text-lg font-medium text-stone-500">
                Total Amount
              </span>
              <span className="text-3xl font-black text-green-800">
                ₹{totalPrice()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
