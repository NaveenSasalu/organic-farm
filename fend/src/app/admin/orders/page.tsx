"use client";
import { useEffect, useState } from "react";
import { Package, Calendar, User, MapPin, XCircle, Truck } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { API_BASE_URL } from "@/lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    const url =
      statusFilter === "all"
        ? `${API_BASE_URL}/orders/`
        : `${API_BASE_URL}/orders/?status=${statusFilter}`;
    const res = await fetch(url);
    setOrders(await res.json());
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleCancel = async (id: number) => {
    if (confirm("Are you sure you want to cancel this community order?")) {
      await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
        method: "PATCH",
      });
      fetchOrders();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-stone-900 mb-6 uppercase tracking-tighter italic">
          Delivery Schedule
        </h1>
        <AdminNav />
        {/* Filter Bar */}
        <div className="flex gap-4 mb-8 bg-white p-4 rounded-3xl border border-stone-200 shadow-sm overflow-x-auto">
          {["all", "pending", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-6 py-2 rounded-xl font-bold text-sm capitalize transition ${
                statusFilter === s
                  ? "bg-stone-900 text-white"
                  : "bg-stone-50 text-stone-500 hover:bg-stone-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className={`bg-white rounded-[2rem] border-2 transition-all ${
                order.status === "cancelled"
                  ? "border-red-100 opacity-60"
                  : "border-stone-100 shadow-sm"
              }`}
            >
              <div className="p-8 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="flex items-center gap-1 text-stone-400 font-mono text-xs">
                      <Calendar size={14} /> Deliver by:{" "}
                      {order.delivery_date || "TBD"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-stone-800">
                      {order.customer_name}
                    </h3>
                    <p className="text-stone-400 text-sm font-medium">
                      {order.address}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <div className="text-3xl font-black text-stone-900">
                    ₹{order.total_price}
                  </div>
                  <div className="flex gap-2">
                    {order.status !== "cancelled" &&
                      order.status !== "delivered" && (
                        <>
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition"
                            title="Cancel Order"
                          >
                            <XCircle size={24} />
                          </button>
                          <button className="bg-green-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100">
                            <Truck size={18} /> Mark Delivered
                          </button>
                        </>
                      )}
                  </div>
                </div>
              </div>

              {/* Farmer Item Breakdown */}
              <div className="px-8 pb-8 flex flex-wrap gap-3">
                {order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-stone-50 px-4 py-2 rounded-xl border border-stone-100 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs font-bold text-stone-600">
                      {item.product.name} ({item.quantity} {item.product.unit})
                      <span className="ml-1 text-[10px] text-stone-400 uppercase">
                        {" "}
                        - {item.product.farmer.name}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
