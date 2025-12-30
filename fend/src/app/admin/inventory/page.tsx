"use client";
import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import ProduceModal from "@/components/ProduceModel"; // The modal we created
import { Plus, Save, Edit3, PlusCircle } from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadData = async () => {
    const [pRes, fRes] = await Promise.all([
      fetch("https://of.kaayaka.in/api/v1/products/"),
      fetch("https://of.kaayaka.in/api/v1/farmers/"),
    ]);
    setProducts(await pRes.json());
    setFarmers(await fRes.json());
  };

  const fetchProducts = async () => {
    const role = localStorage.getItem("user_role");
    // If the backend is set up to detect the user from the cookie,
    // you can just hit a special "/my-products" endpoint.
    const url =
      role === "admin"
        ? "https://of.kaayaka.in/api/v1/products/"
        : "https://of.kaayaka.in/api/v1/products/me";

    const res = await fetch(url, { credentials: "include" });
    setProducts(await res.json());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 p-8 text-stone-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter">
            FARM INVENTORY
          </h1>
          {/* ADD PRODUCE BUTTON */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-stone-900">
              Inventory & Stock
            </h1>
            <button
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="bg-green-800 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-100"
            >
              <PlusCircle size={20} /> Add New Harvest
            </button>
          </div>
        </div>

        <AdminNav />

        <div className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
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
                  className="hover:bg-stone-50/50 transition"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={product.image_url}
                        className="w-14 h-14 rounded-2xl object-cover border border-stone-100 shadow-sm"
                      />
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
                      {product.farmer?.name}
                    </span>
                  </td>
                  <td className="p-6 text-center font-black text-lg">
                    {product.stock_qty}
                  </td>
                  <td className="p-6 text-right space-x-2">
                    {/* EDIT BUTTON */}
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setModalOpen(true);
                      }}
                      className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition"
                    >
                      <Edit3 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* THE MODAL COMPONENT */}
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
