"use client";

import { useEffect, useState, useCallback } from "react";
import AdminNav from "@/components/AdminNav";
import ProduceModal from "@/components/ProduceModel";
import { Plus, Edit3, Loader2, Inbox } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

// Use the production HTTPS URL

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

    const requestOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      // Note: We use HTTPS explicitly here
      const [pRes, fRes] = await Promise.all([
        fetch(`${API_BASE_URL}/products/`, requestOptions),
        fetch(`${API_BASE_URL}/farmers/`, requestOptions),
      ]);

      if (pRes.status === 401 || fRes.status === 401) {
        // Optional: Redirect to login if token is invalid
        window.location.href = "/login";
        return;
      }

      const pData = await pRes.json();
      const fData = await fRes.json();

      setProducts(Array.isArray(pData) ? pData : []);
      setFarmers(Array.isArray(fData) ? fData : []);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-stone-50 p-8 text-stone-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-4xl font-black italic tracking-tighter">
            FARM INVENTORY
          </h1>

          <button
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="bg-green-800 text-white px-8 py-4 rounded-[2rem] font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-95"
          >
            <Plus size={20} /> Add Harvest
          </button>
        </div>

        <AdminNav />

        <div className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="font-medium">Loading inventory...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-12">
              <Inbox size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-stone-600">No products found</p>
              <p className="text-sm">Start by adding your first harvest.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 border-b border-stone-100 text-[10px] font-black uppercase text-stone-400">
                  <tr>
                    <th className="p-6">Produce</th>
                    <th className="p-6">Farmer</th>
                    <th className="p-6 text-center">In Stock</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((product: any) => (
                    <tr
                      key={product.id}
                      className="hover:bg-stone-50/50 transition group"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-stone-100 shadow-sm bg-stone-50">
                            <img
                              src={
                                product.image_url || "/placeholder-produce.png"
                              }
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/100x100?text=No+Image";
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-stone-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-stone-400 font-medium">
                              ₹{product.price} / {product.unit}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full ring-1 ring-green-100">
                          {product.farmer?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="p-6 text-center font-black text-lg">
                        <span
                          className={
                            product.stock_qty <= 5 ? "text-amber-600" : ""
                          }
                        >
                          {product.stock_qty}
                        </span>
                      </td>
                      <td className="p-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setModalOpen(true);
                          }}
                          className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition active:bg-stone-300"
                        >
                          <Edit3 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ProduceModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        farmers={farmers}
        onRefresh={loadData}
      />
    </div>
  );
}
