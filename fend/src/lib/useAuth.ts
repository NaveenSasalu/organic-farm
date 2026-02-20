"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import type { UserRole } from "@/types";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  error: string;
}

export const useAuth = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Validate token with server
  const validateToken = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token is invalid or expired - clear local state
        clearAuthState();
        return false;
      }

      return response.ok;
    } catch {
      // Network error - don't clear state, might be temporary
      return false;
    }
  }, []);

  // Clear all auth state
  const clearAuthState = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    sessionStorage.clear();
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure";
  }, []);

  // Check auth state on mount (useful for protected pages)
  const checkAuth = useCallback(async (): Promise<AuthState> => {
    setIsValidating(true);
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("user_role") as UserRole | null;

    if (!token) {
      setIsValidating(false);
      return { isAuthenticated: false, isLoading: false, role: null, error: "" };
    }

    const isValid = await validateToken();
    setIsValidating(false);

    if (!isValid) {
      return { isAuthenticated: false, isLoading: false, role: null, error: "Session expired" };
    }

    return { isAuthenticated: true, isLoading: false, role, error: "" };
  }, [validateToken]);

  const login = async (email: string, password: string) => {
    setError("");

    // Client-side validation
    if (!email || !password) {
      setError("Email and password are required");
      throw new Error("Email and password are required");
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      throw new Error("Please enter a valid email address");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password: password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Login failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.access_token) {
        // 1. Sync LocalStorage
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user_role", data.role);

        // 2. Set Cookie for Middleware (Must match middleware.ts which checks 'access_token')
        // Cookie expires in 1 hour to match JWT expiration
        document.cookie = `access_token=${data.access_token}; path=/; max-age=${
          60 * 60
        }; SameSite=Strict; Secure`;

        // 3. Hard redirect to refresh all auth states
        window.location.href =
          data.role === "admin" ? "/admin/orders" : "/admin/inventory";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("token");

    // 1. Attempt server-side logout (blacklist token)
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
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

    // 2. Clear all auth state
    clearAuthState();

    // 3. RESET APP STATE
    window.location.href = "/";
  };

  // Get current auth state without validation
  const getAuthState = useCallback((): { token: string | null; role: UserRole | null } => {
    return {
      token: localStorage.getItem("token"),
      role: localStorage.getItem("user_role") as UserRole | null,
    };
  }, []);

  return {
    login,
    logout,
    error,
    checkAuth,
    validateToken,
    getAuthState,
    isValidating,
    clearAuthState,
  };
};
