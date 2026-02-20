"use client";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Search,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Leaf,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { isValidEmail, isValidOrderId } from "@/lib/validation";
import type { Order, OrderItem, OrderStatus } from "@/types";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("order") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = useCallback(async () => {
    // Validate inputs
    if (!orderId || !email) {
      setError("Please enter both order number and email");
      return;
    }

    if (!isValidOrderId(orderId)) {
      setError("Please enter a valid order number");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/orders/track?order_id=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`
      );

      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else if (res.status === 404) {
        setError("Order not found. Please check your order number and email.");
      } else if (res.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        setError("Failed to fetch order. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  }, [orderId, email]);

  // Auto-fetch if params are present
  useEffect(() => {
    if (searchParams.get("order") && searchParams.get("email")) {
      handleTrack();
    }
  }, [searchParams, handleTrack]);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="text-green-600" size={24} />;
      case "cancelled":
        return <XCircle className="text-red-600" size={24} />;
      case "packed":
        return <Package className="text-purple-600" size={24} />;
      case "confirmed":
        return <Truck className="text-blue-600" size={24} />;
      default:
        return <Clock className="text-amber-600" size={24} />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "packed":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const getStatusMessage = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Your order is being processed";
      case "confirmed":
        return "Order confirmed! Farmers are harvesting your produce";
      case "packed":
        return "Your order is packed and ready for delivery";
      case "delivered":
        return "Your order has been delivered. Enjoy!";
      case "cancelled":
        return "This order has been cancelled";
      default:
        return "Processing your order";
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-stone-400 mb-6 hover:text-stone-600"
        >
          <ArrowLeft size={16} /> Back to shop
        </Link>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-stone-200">
          <h1 className="text-3xl font-black text-stone-900 mb-2">Track Your Order</h1>
          <p className="text-stone-500 mb-8">Enter your order details to see the status</p>

          {/* Search Form */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 mb-2 block">
                Order Number
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 1 or 000001"
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email used during checkout"
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <button
              onClick={handleTrack}
              disabled={loading}
              className="w-full bg-green-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Searching...
                </>
              ) : (
                <>
                  <Search size={20} /> Track Order
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm mb-6">
              {error}
            </div>
          )}

          {/* Order Details */}
          {order && (
            <div className="border-t border-stone-100 pt-8">
              {/* Status Header */}
              <div className={`p-6 rounded-2xl border-2 mb-6 ${getStatusColor(order.status)}`}>
                <div className="flex items-center gap-4">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-70">
                      Order #{String(order.id).padStart(6, "0")}
                    </p>
                    <p className="text-xl font-black capitalize">{order.status}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium opacity-80">
                  {getStatusMessage(order.status)}
                </p>
              </div>

              {/* Order Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-stone-600">
                  <Calendar size={18} className="text-stone-400" />
                  <span className="font-medium">
                    Ordered on: {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                {order.delivery_date && (
                  <div className="flex items-center gap-3 text-stone-600">
                    <Truck size={18} className="text-stone-400" />
                    <span className="font-medium">
                      Delivery: {new Date(order.delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3 text-stone-600">
                  <MapPin size={18} className="text-stone-400 mt-0.5" />
                  <span className="font-medium">{order.address}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-stone-50 rounded-2xl p-6">
                <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4">
                  Order Items
                </p>
                <div className="space-y-3">
                  {order.items?.map((item: OrderItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800">{item.product?.name || "Product"}</p>
                          <p className="text-xs text-stone-400">₹{item.price_at_time} each</p>
                        </div>
                      </div>
                      {item.is_harvested && (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                          <Leaf size={14} /> Harvested
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center">
                  <span className="font-bold text-stone-600">Total</span>
                  <span className="text-2xl font-black text-green-700">₹{order.total_price}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
