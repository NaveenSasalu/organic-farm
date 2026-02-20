"use client";
import { useEffect, useState } from "react";
import {
  Package,
  Calendar,
  MapPin,
  XCircle,
  Truck,
  CheckCircle2,
  Leaf,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { API_BASE_URL } from "@/lib/api";
import type { Order, OrderItem, OrderStatus, UserRole } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    const url =
      statusFilter === "all"
        ? `${API_BASE_URL}/orders/`
        : `${API_BASE_URL}/orders/?status=${statusFilter}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      // Handle paginated response - extract items array
      if (data && data.items) {
        setOrders([...data.items]);
      } else {
        // Fallback for non-paginated response
        setOrders(Array.isArray(data) ? [...data] : []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleCancel = async (id: number) => {
    if (confirm("Are you sure you want to cancel this order? Stock will be restored.")) {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          fetchOrders();
        } else {
          const data = await res.json();
          alert(data.detail || "Failed to cancel order");
        }
      } catch (err) {
        alert("Failed to cancel order");
      }
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (id: number) => {
    if (confirm("Mark this order as delivered?")) {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${id}/status?status=delivered`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          fetchOrders();
        } else {
          const data = await res.json();
          alert(data.detail || "Failed to update order");
        }
      } catch (err) {
        alert("Failed to update order");
      }
      setLoading(false);
    }
  };

  const handleHarvestComplete = async (itemId: number) => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL}/orders/items/${itemId}/harvest`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchOrders();
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to mark as harvested");
      }
    } catch (err) {
      alert("Failed to mark as harvested");
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "packed":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tighter italic">
            {role === "admin" ? "Logistics Dashboard" : "Harvest Schedule"}
          </h1>
          <p className="text-stone-500 font-bold text-sm">
            {role === "admin"
              ? "Overseeing community fulfillment"
              : "Items assigned to your farm for harvest"}
          </p>
        </header>

        <AdminNav />

        {/* Filter Bar */}
        <div className="flex gap-4 mb-8 bg-white p-2 rounded-3xl border border-stone-200 shadow-sm overflow-x-auto no-scrollbar">
          {["all", "pending", "confirmed", "packed", "delivered", "cancelled"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-6 py-2 rounded-2xl font-bold text-xs capitalize transition whitespace-nowrap ${
                  statusFilter === s
                    ? "bg-green-800 text-white shadow-lg shadow-green-100"
                    : "bg-transparent text-stone-500 hover:bg-stone-50"
                }`}
              >
                {s}
              </button>
            ),
          )}
        </div>

        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-stone-200">
              <Package className="mx-auto text-stone-200 mb-4" size={48} />
              <p className="text-stone-400 font-bold">
                No orders found for this criteria.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={`${order.id}-${order.status}`}
                className={`bg-white rounded-[2.5rem] border-2 transition-all overflow-hidden ${
                  order.status === "cancelled"
                    ? "border-red-50 opacity-60"
                    : "border-stone-100 shadow-sm"
                }`}
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                        #{String(order.id).padStart(6, '0')}
                      </span>
                      <span className="flex items-center gap-1 text-stone-400 font-bold text-xs">
                        <Calendar size={14} /> {order.delivery_date || "Pending"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-stone-800 tracking-tight">
                        {role === "admin"
                          ? order.customer_name
                          : `Order #${String(order.id).padStart(6, '0')}`}
                      </h3>
                      {role === "admin" && (
                        <>
                          <p className="text-stone-500 text-sm font-medium mt-1">
                            {order.customer_email}
                          </p>
                          <p className="text-stone-400 text-sm font-bold flex items-center gap-1 mt-1">
                            <MapPin size={14} /> {order.address}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-4">
                    <div className="text-3xl font-black text-stone-900">
                      ₹{order.total_price}
                    </div>

                    <div className="flex gap-2">
                      {role === "admin" &&
                        order.status !== "cancelled" &&
                        order.status !== "delivered" && (
                          <>
                            <button
                              onClick={() => handleCancel(order.id)}
                              disabled={loading}
                              className="p-4 text-red-400 hover:bg-red-50 rounded-2xl transition active:scale-90 disabled:opacity-50"
                            >
                              <XCircle size={24} />
                            </button>
                            <button
                              onClick={() => handleMarkDelivered(order.id)}
                              disabled={loading}
                              className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-stone-800 shadow-xl transition active:scale-95 disabled:opacity-50"
                            >
                              <Truck size={18} /> Mark Delivered
                            </button>
                          </>
                        )}
                      {order.status === "delivered" && (
                        <span className="flex items-center gap-2 text-green-600 font-bold">
                          <CheckCircle2 size={20} /> Delivered
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* The "Pick List" section - Actionable for Farmers */}
                <div className="bg-stone-50/50 p-6 md:p-8 border-t border-stone-100 space-y-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">
                    Items to fulfill
                  </p>
                  {order.items.map((item) => (
                    <div
                      key={`${item.id}-${item.is_harvested}`}
                      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border shadow-sm ${
                        item.is_harvested
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border ${
                          item.is_harvested
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-green-50 text-green-700 border-green-100"
                        }`}>
                          {item.quantity}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-[10px] font-bold text-stone-400 uppercase italic">
                            Source: {item.product?.farmer?.name || "Organic Farm"}
                          </p>
                        </div>
                      </div>

                      {item.is_harvested ? (
                        <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold text-xs">
                          <Leaf size={16} /> Harvested
                        </span>
                      ) : (
                        role === "farmer" && order.status === "pending" && (
                          <button
                            onClick={() => handleHarvestComplete(item.id)}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-stone-100 rounded-xl text-stone-600 font-black text-xs hover:border-green-500 hover:text-green-600 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          >
                            <CheckCircle2 size={16} />
                            Mark Harvested
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
