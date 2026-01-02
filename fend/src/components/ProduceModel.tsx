"use client";

import { X, Upload, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function ProduceModal({
  isOpen,
  onClose,
  product,
  farmers,
  onRefresh,
}: any) {
  const [issubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // 1. Initialize FormData from the form fields
    const formData = new FormData(e.currentTarget);

    // 2. Security: Get Role and FarmerID from LocalStorage
    const role = localStorage.getItem("user_role");
    const farmerId = localStorage.getItem("farmer_id");

    // 3. Force the Farmer ID if the logged-in user is a Farmer
    if (role === "farmer" && farmerId) {
      formData.set("farmer_id", farmerId);
    }

    // 4. Handle ID for Edit Mode
    if (product?.id) {
      formData.append("id", product.id);
    }

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL}/products/upsert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401)
        throw new Error("Session expired. Please log in again.");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to save harvest");
      }

      onRefresh();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
      console.error("Upsert Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-2xl font-black text-stone-900">
            {product ? "Edit Produce" : "Add New Harvest"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
                Produce Name
              </label>
              <input
                name="name"
                defaultValue={product?.name}
                required
                placeholder="e.g. Organic Baby Spinach"
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
                Price (₹)
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={product?.price}
                required
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
                Stock Quantity
              </label>
              <input
                name="stock_qty"
                type="number"
                defaultValue={product?.stock_qty}
                required
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
                Unit
              </label>
              <select
                name="unit"
                defaultValue={product?.unit || "kg"}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="kg">per Kilogram (kg)</option>
                <option value="bundle">per Bundle</option>
                <option value="pc">per Piece</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
                Farmer / Source
              </label>
              <select
                name="farmer_id"
                defaultValue={product?.farmer_id}
                required
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="">Select Farmer</option>
                {farmers.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
              Harvest Photo {product && "(Leave blank to keep current)"}
            </label>
            <div className="relative border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-green-400 transition cursor-pointer group">
              <input
                name="file"
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload
                className="mx-auto text-stone-300 group-hover:text-green-600 mb-2"
                size={24}
              />
              <p className="text-xs text-stone-400 group-hover:text-stone-600">
                Click or drag image to upload
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={issubmitting}
            className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {issubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Save Harvest <Check size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
