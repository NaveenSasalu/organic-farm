"use client";
import { useState } from "react";

export default function ProductForm({ product, onClose, onRefresh }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    if (product?.id) formData.append("id", product.id);

    await fetch("http://localhost:8000/api/v1/products/", {
      method: "POST",
      body: formData,
    });

    setLoading(false);
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-4"
      >
        <h2 className="text-2xl font-bold">
          {product ? "Edit Produce" : "Add New Harvest"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            name="name"
            defaultValue={product?.name}
            placeholder="Product Name (e.g. Carrots)"
            className="col-span-2 p-4 bg-stone-50 border border-stone-200 rounded-xl"
            required
          />
          <input
            name="price"
            type="number"
            defaultValue={product?.price}
            placeholder="Price (₹)"
            className="p-4 bg-stone-50 border border-stone-200 rounded-xl"
            required
          />
          <input
            name="stock_qty"
            type="number"
            defaultValue={product?.stock_qty}
            placeholder="Stock Qty"
            className="p-4 bg-stone-50 border border-stone-200 rounded-xl"
            required
          />
          <input
            name="unit"
            defaultValue={product?.unit}
            placeholder="Unit (kg/pc)"
            className="p-4 bg-stone-50 border border-stone-200 rounded-xl"
            required
          />
          <input
            name="farmer_name"
            defaultValue={product?.farmer_name}
            placeholder="Farmer Name"
            className="p-4 bg-stone-50 border border-stone-200 rounded-xl"
            required
          />
        </div>

        <div className="border-2 border-dashed border-stone-200 p-4 rounded-xl text-center">
          <input name="file" type="file" className="text-sm" />
          <p className="text-[10px] text-stone-400 mt-2">
            Upload a fresh photo of the harvest
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 font-bold text-stone-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-4 bg-green-800 text-white rounded-2xl font-bold shadow-lg shadow-green-100"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
