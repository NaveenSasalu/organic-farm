"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export const useAuth = () => {
  const router = useRouter();
  const [error, setError] = useState("");

  const login = async (email, password) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password: password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();

      if (data.access_token) {
        // 1. Sync LocalStorage
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user_role", data.role);

        // 2. Set Cookie for Middleware (Match the name: 'token')
        // We use 'token' to be consistent with localStorage
        document.cookie = `token=${data.access_token}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; SameSite=Strict; Secure`;

        // 3. Hard redirect to refresh all auth states
        window.location.href =
          data.role === "admin" ? "/admin/orders" : "/admin/inventory";
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("token");

    // 1. Attempt server-side logout
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.warn("Server logout failed, clearing local session...");
      }
    }

    // 2. CLEAR EVERYTHING
    localStorage.clear();
    sessionStorage.clear();

    // 3. CLEAR COOKIE (Crucial for Middleware)
    // We set the expiry to a past date to delete it
    //document.cookie =
    //  "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure";

    // 4. RESET APP STATE
    window.location.href = "/";
  };

  return { login, logout, error };
};
