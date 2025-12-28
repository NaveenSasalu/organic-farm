"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { UserPlus, MapPin, FileText, Camera } from "lucide-react";

export default function RegisterFarmer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // 1. Use FormData to capture the file and text inputs
    const formData = new FormData(e.currentTarget);

    try {
      // 2. Send the formData object directly. DO NOT set Content-Type header.
      // The browser will automatically set it to multipart/form-data with a "boundary"
      const res = await fetch(`http://localhost:8000/api/v1/farmers/`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Farmer registered successfully!");
        router.push("/admin/inventory");
      }
    } catch (err) {
      console.error(err);
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
              <label className="text-[10px] font-black uppercase text-stone-400">
                Profile Picture
              </label>
              <input
                name="file"
                type="file"
                required
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:bg-stone-300"
            >
              {loading ? "Registering..." : "Complete Registration"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
