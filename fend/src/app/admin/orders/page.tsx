"use client";

import { useEffect, useState } from "react";
import { Package, Calendar, User, MapPin } from "lucide-react";
import AdminNav from "@/components/AdminNav";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/orders/")
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  const markAsDelivered = async (orderId: number) => {
    await fetch(
      `http://localhost:8000/api/v1/orders/${orderId}/status?status=delivered`,
      {
        method: "PATCH",
      }
    );
    // Refresh the data locally
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-stone-900 mb-8 flex items-center gap-3">
          <Package className="text-green-700" /> Incoming Harvest Orders
        </h1>
        <AdminNav />
        <div className="grid gap-6">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-tighter ring-1 ring-amber-200">
                  Pending Harvest
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500 font-mono text-xs font-bold">
                  ORD-{order.id.toString().padStart(4, "0")}
                </span>
              </div>

              <div className="p-6 flex flex-col md:flex-row justify-between border-b border-stone-100 bg-stone-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <Calendar size={14} />{" "}
                    {new Date(order.created_at).toLocaleString()}
                  </div>
                  <div className="text-xl font-bold flex items-center gap-2 text-stone-800">
                    <User size={18} className="text-stone-400" />{" "}
                    {order.customer_name}
                  </div>
                  <div className="text-stone-500 text-sm flex items-center gap-2">
                    <MapPin size={14} /> {order.address}
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <span className="text-xs font-black uppercase text-stone-400 tracking-widest">
                    Total Value
                  </span>
                  <div className="text-3xl font-black text-green-700">
                    ₹{order.total_price}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
                  Items to Pack
                </h4>
                <div className="flex flex-wrap gap-4">
                  {/* Inside the order.items.map loop */}
                  {order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-white p-3 rounded-xl border border-stone-100 shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-stone-800 leading-none">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {item.quantity} {item.product.unit} @ ₹
                          {item.price_at_time}
                        </p>
                      </div>
                      <div className="text-right font-black text-stone-700">
                        ₹{item.quantity * item.price_at_time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center p-6 bg-stone-50 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      order.status === "delivered"
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <span className="text-sm font-bold capitalize text-stone-600">
                    {order.status}
                  </span>
                </div>

                {order.status !== "delivered" && (
                  <button
                    onClick={() => markAsDelivered(order.id)}
                    className="bg-green-700 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-green-800 transition shadow-md"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
