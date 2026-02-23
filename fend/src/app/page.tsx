import { fetchProducts } from "@/lib/api";
import { Leaf, Info, Package } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";
import CartCounter from "@/components/CartCounter";
import FarmerLink from "@/components/FarmerLink";
import Link from "next/link";
import { sanitizeImageUrl } from "@/lib/validation";
import type { Product } from "@/types";

// Force dynamic rendering - fetch fresh data from DB on every visit
export const dynamic = "force-dynamic";

export default async function Home() {
  // Use a try/catch or the existing .catch to handle DB connection issues
  const products = await fetchProducts().catch((err) => {
    console.error("Home Page Fetch Error:", err);
    return [];
  });

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-6 px-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-green-700 p-2 rounded-lg group-hover:bg-green-600 transition-colors">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-green-900 tracking-tight">
              Organic Oasis
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/track"
              className="flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-green-700 transition-colors"
            >
              <Package size={18} />
              <span className="hidden sm:inline">Track Order</span>
            </Link>
            <CartCounter />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 border-l-4 border-green-700 pl-6">
          <div>
            <span className="text-green-700 font-bold uppercase tracking-widest text-xs">
              Direct from Yelachaguppe Farm
            </span>
            <h2 className="text-4xl font-extrabold text-stone-900 mt-1">
              Today's Fresh Harvest
            </h2>
          </div>
          <p className="text-stone-500 max-w-xs text-sm leading-relaxed italic">
            "Picked at sunrise, delivered by sunset. All our produce is 100%
            pesticide-free."
          </p>
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-stone-200">
            <p className="text-stone-400 font-medium text-lg">
              Our baskets are currently empty. Check back tomorrow morning!
            </p>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product: Product) => (
            <div
              key={product.id}
              className="group bg-white rounded-[2rem] border border-stone-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col"
            >
              {/* Image Section */}
              <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={sanitizeImageUrl(product.image_url, "/placeholder-produce.png")}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-300 italic">
                    {product.name}
                  </div>
                )}
              </div>

              {/* Farmer Badge */}
              <div className="px-8 pt-6">
                <FarmerLink
                  farmerId={product.farmer?.id || 0}
                  className="inline-flex items-center gap-2 group/farmer"
                >
                  {product.farmer?.profile_pic ? (
                    <img
                      src={sanitizeImageUrl(product.farmer.profile_pic, "/placeholder-farmer.png")}
                      className="w-8 h-8 rounded-full object-cover border-2 border-green-100"
                      alt={product.farmer.name}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700">
                      {product.farmer?.name?.[0] || "?"}
                    </div>
                  )}
                  <span className="text-xs font-bold text-stone-500 group-hover/farmer:text-green-700 transition-colors">
                    Grown by{" "}
                    <span className="underline decoration-amber-300">
                      {product.farmer?.name || "Verified Local Farmer"}
                    </span>
                  </span>
                </FarmerLink>
              </div>

              {/* Product Info */}
              <div className="p-8 pt-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-stone-800 group-hover:text-green-800 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-stone-400 font-medium">{product.unit}</p>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-full text-stone-400 hover:text-stone-600 transition-colors cursor-pointer">
                    <Info size={18} />
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold uppercase tracking-tighter ${
                        product.stock_qty < 10
                          ? "text-orange-600"
                          : "text-stone-400"
                      }`}
                    >
                      {product.stock_qty > 0
                        ? `${product.stock_qty} ${product.unit} remaining`
                        : "Out of Stock"}
                    </span>
                    <span className="text-3xl font-black text-stone-900">
                      ₹{product.price}
                    </span>
                  </div>

                  {product.stock_qty > 0 ? (
                    <AddToCartButton product={product} />
                  ) : (
                    <button
                      disabled
                      className="bg-stone-100 text-stone-400 px-6 py-3 rounded-2xl font-bold cursor-not-allowed"
                    >
                      Sold Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
