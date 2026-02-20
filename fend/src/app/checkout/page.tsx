"use client";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { ArrowLeft, Truck, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { validateCheckoutForm, validateQuantity } from "@/lib/validation";
import type { OrderCreateRequest, Product } from "@/types";

interface OrderSuccessState {
  id: number;
  email: string;
}

interface FormErrors {
  customer_name?: string;
  customer_email?: string;
  address?: string;
  cart?: string;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart, updateQuantity, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [validatingCart, setValidatingCart] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessState | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Validate cart items against server on mount
  useEffect(() => {
    async function validateCart() {
      if (items.length === 0) {
        setValidatingCart(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/products/public/`);
        if (res.ok) {
          const data = await res.json();
          const serverProducts: Product[] = data.items || data;

          // Check each cart item against server data
          let hasChanges = false;
          const updatedErrors: FormErrors = {};

          for (const cartItem of items) {
            const serverProduct = serverProducts.find((p) => p.id === cartItem.id);

            if (!serverProduct) {
              // Product no longer exists
              removeItem(cartItem.id);
              hasChanges = true;
              updatedErrors.cart = "Some items were removed as they're no longer available";
            } else if (serverProduct.price !== cartItem.price) {
              // Price changed - could update or warn user
              updatedErrors.cart = "Some prices have changed. Please review your cart.";
            } else if (serverProduct.stock_qty < cartItem.quantity) {
              // Not enough stock
              if (serverProduct.stock_qty === 0) {
                removeItem(cartItem.id);
              } else {
                updateQuantity(cartItem.id, serverProduct.stock_qty);
              }
              hasChanges = true;
              updatedErrors.cart = "Some quantities were adjusted due to stock availability";
            }
          }

          if (Object.keys(updatedErrors).length > 0) {
            setErrors(updatedErrors);
          }
        }
      } catch (err) {
        console.error("Failed to validate cart:", err);
      }
      setValidatingCart(false);
    }

    validateCart();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const customerName = formData.get("customer_name") as string;
    const customerEmail = formData.get("customer_email") as string;
    const address = formData.get("address") as string;

    // Client-side validation
    const validation = validateCheckoutForm({
      customer_name: customerName,
      customer_email: customerEmail,
      address: address,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Validate quantities
    for (const item of items) {
      const quantityError = validateQuantity(item.quantity);
      if (quantityError) {
        setErrors({ cart: `${item.name}: ${quantityError}` });
        return;
      }
    }

    setLoading(true);

    const orderPayload: OrderCreateRequest = {
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      address: address.trim(),
      total_price: totalPrice(),
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderSuccess({ id: data.order_id, email: customerEmail });
        clearCart();
      } else {
        const error = await res.json();
        setErrors({ cart: error.detail || "Failed to place order. Please try again." });
      }
    } catch (err) {
      setErrors({ cart: "Farm server error. Please try again later." });
    }
    setLoading(false);
  };

  // Show success screen with order details
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border border-stone-200 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h1 className="text-3xl font-black text-stone-900 mb-2">Order Placed!</h1>
          <p className="text-stone-500 mb-6">We'll start picking your fresh produce.</p>

          <div className="bg-stone-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-stone-400 font-bold uppercase tracking-widest mb-2">Your Order Number</p>
            <p className="text-4xl font-black text-green-700">#{String(orderSuccess.id).padStart(6, '0')}</p>
          </div>

          <p className="text-sm text-stone-500 mb-6">
            Save this number to track your order status.
          </p>

          <div className="space-y-3">
            <Link
              href={`/track?order=${orderSuccess.id}&email=${encodeURIComponent(orderSuccess.email)}`}
              className="block w-full bg-green-800 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition"
            >
              Track My Order
            </Link>
            <Link
              href="/"
              className="block w-full bg-stone-100 text-stone-700 py-4 rounded-2xl font-bold hover:bg-stone-200 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (validatingCart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-green-600 mb-4" size={40} />
        <p className="text-stone-500 font-medium">Validating your cart...</p>
      </div>
    );
  }

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

          {/* Global error message */}
          {errors.cart && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 mb-4">
              <AlertCircle size={18} /> {errors.cart}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="customer_name"
                placeholder="Full Name"
                required
                minLength={2}
                maxLength={100}
                className={`w-full p-4 bg-stone-50 border rounded-2xl focus:ring-2 focus:ring-green-500 outline-none ${
                  errors.customer_name ? "border-red-300" : "border-stone-200"
                }`}
              />
              {errors.customer_name && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.customer_name}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                name="customer_email"
                placeholder="Email Address"
                required
                className={`w-full p-4 bg-stone-50 border rounded-2xl focus:ring-2 focus:ring-green-500 outline-none ${
                  errors.customer_email ? "border-red-300" : "border-stone-200"
                }`}
              />
              {errors.customer_email && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.customer_email}</p>
              )}
            </div>
            <div>
              <textarea
                name="address"
                placeholder="Delivery Address (in Bengaluru)"
                required
                minLength={10}
                maxLength={500}
                className={`w-full p-4 bg-stone-50 border rounded-2xl focus:ring-2 focus:ring-green-500 outline-none h-32 ${
                  errors.address ? "border-red-300" : "border-stone-200"
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.address}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Placing Order...
                </>
              ) : (
                <>
                  Confirm Order <Truck size={20} />
                </>
              )}
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
