import { Leaf, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

async function getFarmer(id: string) {
  const res = await fetch(`${API_BASE_URL}/farmers/${id}`, {
    cache: "no-store",
  });
  return res.json();
}

// src/app/farmer/[id]/page.tsx
export default async function FarmerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Await the params promise first
  const { id } = await params;

  // 2. Now use the id to fetch the farmer
  const farmer = await getFarmer(id);

  if (!farmer) {
    return <div className="p-20 text-center">Farmer not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8]">
      {/* Hero Section */}
      <div className="bg-green-900 text-white pt-20 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-green-300 mb-8 hover:text-white transition"
          >
            <ArrowLeft size={20} /> Back to Marketplace
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <img
              src={farmer.profile_pic || "https://via.placeholder.com/150"}
              className="w-48 h-48 rounded-[3rem] object-cover border-4 border-white/20 shadow-2xl"
            />
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-black mb-2">{farmer.name}</h1>
              <p className="flex items-center justify-center md:justify-start gap-2 text-green-200 font-bold uppercase tracking-widest text-sm mb-6">
                <MapPin size={16} /> {farmer.location}
              </p>
              <p className="text-lg text-green-50 max-w-2xl leading-relaxed italic">
                "{farmer.bio}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Farmer's Produce Section */}
      <div className="max-w-6xl mx-auto px-6 -mt-16">
        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-stone-100">
          <h2 className="text-3xl font-black text-stone-900 mb-8 flex items-center gap-3">
            <Leaf className="text-green-700" /> Current Harvest from{" "}
            {farmer.name}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Filter and map products belonging only to this farmer */}
            {farmer.products?.map((product: any) => (
              <div
                key={product.id}
                className="border border-stone-100 rounded-[2rem] p-4 hover:shadow-lg transition"
              >
                <img
                  src={product.image_url}
                  className="w-full h-48 object-cover rounded-2xl mb-4"
                />
                <h3 className="font-bold text-xl">{product.name}</h3>
                <p className="text-stone-400 text-sm mb-4">{product.unit}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black text-stone-900">
                    ₹{product.price}
                  </span>
                  {/* Reuse your AddToCartButton here */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
