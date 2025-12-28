export default function FarmerProfile({ farmer }: { farmer: any }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-xl shadow-green-900/5 max-w-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-2xl font-black text-green-800">
          {farmer.name[0]}
        </div>
        <div>
          <h3 className="text-xl font-black text-stone-900">{farmer.name}</h3>
          <p className="text-green-700 text-xs font-bold uppercase tracking-tight">
            {farmer.location}
          </p>
        </div>
      </div>
      <p className="text-stone-500 text-sm leading-relaxed italic">
        "{farmer.bio}"
      </p>
      <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center text-[10px] font-black uppercase text-stone-400">
        <span>Certified Organic</span>
        <span className="text-green-600">Verified Farmer</span>
      </div>
    </div>
  );
}
