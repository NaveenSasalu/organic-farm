"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { API_BASE_URL } from "@/lib/api";
import {
  UserPlus,
  MapPin,
  FileText,
  Camera,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function RegisterFarmer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem("token");

    // Debug: Check if token exists before sending
    if (!token) {
      setError("No active session found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication missing. Please login as admin.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/farmers/`, {
        method: "POST",
        headers: {
          // 1. Manually attach the admin token
          Authorization: `Bearer ${token}`,
          // 2. DO NOT set Content-Type: multipart/form-data
        },
        body: formData, // FormData contains name, email, password, location, bio, and file
      });

      if (res.status === 401) {
        throw new Error(
          "Your session expired. Please log in again to register a farmer."
        );
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Registration failed.");
      }

      alert("Farmer registered successfully!");
      router.push("/admin/inventory");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-stone-900 mb-6 flex items-center gap-3">
          <UserPlus className="text-green-700" /> Community Onboarding
        </h1>

        <AdminNav />

        <div className="bg-white rounded-[2.5rem] p-10 border border-stone-200 shadow-xl shadow-stone-200/50">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-stone-800">Farmer Profile</h2>
            <p className="text-stone-500 text-sm">
              Tell the community about the person behind the harvest.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Farmer Ramesh"
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none pl-12"
                />
                <UserPlus
                  className="absolute left-4 top-4 text-stone-300"
                  size={20}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">
                Farm Location
              </label>
              <div className="relative">
                <input
                  name="location"
                  type="text"
                  required
                  placeholder="e.g. Yelahanka, Bengaluru"
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none pl-12"
                />
                <MapPin
                  className="absolute left-4 top-4 text-stone-300"
                  size={20}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">
                Farmer Bio / Story
              </label>
              <div className="relative">
                <textarea
                  name="bio"
                  required
                  placeholder="Share the farm's history or organic practices..."
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none pl-12 h-32"
                ></textarea>
                <FileText
                  className="absolute left-4 top-4 text-stone-300"
                  size={20}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
                Profile Picture
              </label>
              <div className="relative border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center hover:border-green-400 transition-all group">
                <input
                  name="file"
                  type="file"
                  accept="image/*"
                  required
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Camera
                  className="mx-auto text-stone-300 group-hover:text-green-600 mb-2"
                  size={32}
                />
                <p className="text-xs text-stone-400 font-bold group-hover:text-stone-600">
                  Select a friendly photo
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">
                Login Email
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="farmer@kaayaka.in"
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none pl-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:bg-stone-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
