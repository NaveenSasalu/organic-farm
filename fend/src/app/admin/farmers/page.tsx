"use client";
import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";
import { UserPlus, MapPin, Info, ExternalLink } from "lucide-react";

export default function FarmerListPage() {
  const [farmers, setFarmers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/farmers/")
      .then((res) => res.json())
      .then((data) => setFarmers(data));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black text-stone-900">
            Community Directory
          </h1>
          <Link
            href="/admin/farmers/register"
            className="bg-stone-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-stone-800 transition"
          >
            <UserPlus size={20} /> Register New Farmer
          </Link>
        </div>

        <AdminNav />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmers.map((farmer: any) => (
            <div
              key={farmer.id}
              className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={farmer.profile_pic || "https://via.placeholder.com/100"}
                  className="w-20 h-20 rounded-[1.5rem] object-cover border-4 border-stone-50"
                  alt={farmer.name}
                />
                <div>
                  <h3 className="text-xl font-black text-stone-800">
                    {farmer.name}
                  </h3>
                  <p className="flex items-center gap-1 text-xs font-bold text-green-700 uppercase tracking-tight">
                    <MapPin size={12} /> {farmer.location}
                  </p>
                </div>
              </div>

              <p className="text-stone-500 text-sm line-clamp-3 mb-6 italic leading-relaxed">
                "{farmer.bio}"
              </p>

              <div className="pt-6 border-t border-stone-50 flex justify-between items-center">
                <Link
                  href={`/farmer/${farmer.id}`}
                  className="text-stone-400 hover:text-green-800 text-xs font-black uppercase tracking-widest flex items-center gap-1"
                >
                  View Public Profile <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
