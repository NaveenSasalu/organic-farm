"use client";

import { X, Upload, Check } from "lucide-react";

export default function ProduceModal({
  isOpen,
  onClose,
  product,
  farmers,
  onRefresh,
}: any) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (product) formData.append("id", product.id); // Add ID if editing

    const res = await fetch("https://of.kaayaka.in/api/v1/products/upsert/", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      onRefresh();
      onClose();
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
                defaultValue={product?.price}
                required
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
                Initial Stock
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
              Harvest Photo
            </label>
            <div className="relative border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-green-400 transition cursor-pointer group">
              <input
                name="file"
                type="file"
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
            className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-100"
          >
            Save Harvest <Check size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
