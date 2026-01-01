"use client"; // Critical for Next.js App Router

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth"; // Adjust path based on your setup
import { Leaf, Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [error, setError] = useState("");

  // Get the login function from your custom hook
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    try {
      // All the fetch, localStorage, and routing logic
      // is now handled inside this single call
      await login(email, password);
    } catch (err: any) {
      // If the hook throws an error, catch and display it here
      setLocalError(err.message || "Failed to connect to the secure server.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-green-100 rounded-3xl text-green-700 mb-4 animate-bounce">
            <Leaf size={32} />
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Staff Portal
          </h1>
          <p className="text-stone-500 font-medium">
            Community Management & Farmers
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
              Work Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600 pl-12"
                placeholder="admin@farm.com"
              />
              <Mail
                className="absolute left-4 top-4 text-stone-300"
                size={20}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600 pl-12"
                placeholder="••••••••"
              />
              <Lock
                className="absolute left-4 top-4 text-stone-300"
                size={20}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-800 transition shadow-lg active:scale-95"
          >
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
