"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Leaf,
  Users,
  Shield,
  ExternalLink,
  LogOut,
} from "lucide-react";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  // Load the role from localStorage on mount
  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
  }, []);

  // Configure navigation based on permissions
  const links = [
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Inventory", href: "/admin/inventory", icon: Leaf },
  ];

  // Only show these to users with 'admin' role
  if (role === "admin") {
    links.push({ name: "Farmers", href: "/admin/farmers", icon: Users });
    links.push({ name: "Staff", href: "/admin/users", icon: Shield });
  }

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        localStorage.removeItem("user_role");
        // Hard refresh to clear all internal state
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 border-b border-stone-200 pb-6">
      <nav className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all ${
                isActive
                  ? "bg-green-800 text-white shadow-lg shadow-green-100"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              }`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold hover:bg-stone-50 text-sm"
        >
          <ExternalLink size={16} />
          Store
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition text-sm"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
