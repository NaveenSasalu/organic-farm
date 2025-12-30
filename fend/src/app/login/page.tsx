"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Lock, Mail, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // b - start
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Maintain the URLSearchParams for OAuth2 compatibility
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      // 2. Use apiRequest but pass the formData as the body
      const data = await apiRequest("/auth/login", {
        method: "POST",
        // Do NOT use JSON.stringify here
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      // 3. Your helper already runs res.json(), so 'data' is the actual object
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user_role", data.role);

        router.push(
          data.role === "admin" ? "/admin/orders" : "/admin/inventory"
        );
      }
    } catch (err: any) {
      // 4. Your helper throws errors, so catch them here
      setError(err.message || "Invalid credentials.");
    }
  };
  // b - end

  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");

  //   // FastAPI's OAuth2PasswordRequestForm expects URLSearchParams (form-data)
  //   const formData = new URLSearchParams();
  //   formData.append("username", email);
  //   formData.append("password", password);

  //   try {
  //     const res = await fetch("http://localhost:8000/api/v1/auth/login", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //       body: formData,
  //     });

  //     if (res.ok) {
  //       const data = await res.json();
  //       // Store only the role for UI logic (The secure token stays in the cookie)
  //       localStorage.setItem("user_role", data.role);
  //       router.push(
  //         data.role === "admin" ? "/admin/orders" : "/admin/inventory"
  //       );
  //     } else {
  //       setError("Invalid credentials. Access denied.");
  //     }
  //   } catch (err) {
  //     setError("Connection to server failed.");
  //   }
  // };

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
