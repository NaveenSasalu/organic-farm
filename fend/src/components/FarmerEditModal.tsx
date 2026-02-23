"use client";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface FarmerEditModalProps {
  farmer: { id: number; name: string; location: string; bio: string; profile_pic?: string };
  onClose: () => void;
  onRefresh: () => void;
}

export default function FarmerEditModal({ farmer, onClose, onRefresh }: FarmerEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData();

    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const location = (form.elements.namedItem("location") as HTMLInputElement).value.trim();
    const bio = (form.elements.namedItem("bio") as HTMLTextAreaElement).value.trim();
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;

    if (name) formData.append("name", name);
    if (location) formData.append("location", location);
    if (bio) formData.append("bio", bio);
    if (fileInput.files && fileInput.files[0]) {
      formData.append("file", fileInput.files[0]);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/farmers/${farmer.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update farmer");
      }

      onRefresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-4"
      >
        <h2 className="text-2xl font-bold text-stone-900">Edit Farmer</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Name</label>
            <input
              name="name"
              defaultValue={farmer.name}
              placeholder="Farmer name"
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl"
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Location</label>
            <input
              name="location"
              defaultValue={farmer.location}
              placeholder="Farm location"
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl"
              required
              minLength={5}
              maxLength={200}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Bio</label>
            <textarea
              name="bio"
              defaultValue={farmer.bio}
              placeholder="About the farmer..."
              rows={3}
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl resize-none"
              required
              minLength={10}
              maxLength={1000}
            />
          </div>

          <div className="border-2 border-dashed border-stone-200 p-4 rounded-xl text-center">
            <input name="file" type="file" accept="image/*" className="text-sm" />
            <p className="text-[10px] text-stone-400 mt-2">
              Upload a new profile picture (optional)
            </p>
          </div>
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
            disabled={loading}
            className="flex-1 py-4 bg-green-800 text-white rounded-2xl font-bold shadow-lg shadow-green-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={18} /> Saving...</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
