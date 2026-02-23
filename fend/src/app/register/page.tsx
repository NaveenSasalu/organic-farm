"use client";

import React, { useState } from "react";
import { Leaf, Lock, Mail, User, AlertCircle, Loader2 } from "lucide-react";
import { isValidEmail, validatePassword } from "@/lib/validation";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!name.trim() || name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Registration failed");
      }

      const data = await response.json();

      if (data.access_token) {
        // Store auth state (same pattern as useAuth login)
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user_role", data.role);
        document.cookie = `access_token=${data.access_token}; path=/; max-age=${60 * 60}; SameSite=Strict; Secure`;

        // Redirect to home
        window.location.href = "/";
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
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
            Create Account
          </h1>
          <p className="text-stone-500 font-medium">
            Join the Organic Farm Community
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600 pl-12"
                placeholder="Your full name"
                minLength={2}
              />
              <User
                className="absolute left-4 top-4 text-stone-300"
                size={20}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600 pl-12"
                placeholder="you@example.com"
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
                placeholder="Min 8 chars, upper + lower + digit"
              />
              <Lock
                className="absolute left-4 top-4 text-stone-300"
                size={20}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-600 pl-12"
                placeholder="Re-enter password"
              />
              <Lock
                className="absolute left-4 top-4 text-stone-300"
                size={20}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-800 transition shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-sm text-stone-500">
            Already have an account?{" "}
            <Link href="/login" className="text-green-700 font-bold hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
