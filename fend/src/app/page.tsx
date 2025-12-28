import { fetchProducts } from "@/lib/api";
import { ShoppingBasket, Leaf, Info } from "lucide-react"; // If you installed lucide-react
import AddToCartButton from "@/components/AddToCartButton";
import CartCounter from "@/components/CartCounter";
import Link from "next/link";

export default async function Home() {
  const products = await fetchProducts().catch(() => []);

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 font-sans">
      {/* Header / Hero Section */}
      <header className="bg-white border-b border-stone-200 py-6 px-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-green-700 p-2 rounded-lg">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-green-900 tracking-tight">
              Organic Oasis
            </h1>
          </div>
          {/* This component updates automatically via Zustand */}
          <CartCounter />
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-green-700 font-bold uppercase tracking-widest text-xs">
              Direct from Yelachaguppe Farm
            </span>
            <h2 className="text-4xl font-extrabold text-stone-900 mt-1">
              Today's Fresh Harvest
            </h2>
          </div>
          <p className="text-stone-500 max-w-xs text-sm leading-relaxed">
            Picked at sunrise, delivered by sunset. All our produce is 100%
            pesticide-free.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product: any) => (
            <div
              key={product.id}
              className="group bg-white rounded-[2rem] border border-stone-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              {/* Image Placeholder */}
              <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-300 italic">
                    {product.name}
                  </div>
                )}
              </div>
              {/* Inside your Product Card loop in page.tsx */}
              <Link
                href={`/farmer/${product.farmer.id}`}
                className="flex items-center gap-2 mt-2 group/farmer cursor-pointer"
              >
                {product.farmer.profile_pic ? (
                  <img
                    src={product.farmer.profile_pic}
                    className="w-8 h-8 rounded-full object-cover border-2 border-green-100"
                    alt={product.farmer.name}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700">
                    {product.farmer.name[0]}
                  </div>
                )}
                <span className="text-xs font-bold text-stone-500 group-hover/farmer:text-green-700 transition-colors">
                  Grown by{" "}
                  <span className="underline decoration-amber-300">
                    {product.farmer.name}
                  </span>
                </span>
              </Link>
              {/* Product Info */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-stone-800 group-hover:text-green-800 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-stone-400 font-medium">{product.unit}</p>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer">
                    <Info size={18} />
                  </div>
                </div>

                {/* Inside the product map loop */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div className="flex flex-col">
                    <span className="text-stone-400 text-xs font-bold uppercase tracking-tighter">
                      {product.stock_qty > 0
                        ? `${product.stock_qty} remaining`
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
                      className="bg-stone-200 text-stone-400 w-14 h-14 rounded-2xl cursor-not-allowed"
                    >
                      ✕
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
