import { useRouter } from "next/router";
import { useState } from "react";

// Use the absolute URL since you are hosting the backend elsewhere
const API_URL = "https://of.kaayaka.in/api/v1";

export const useAuth = () => {
  const router = useRouter();
  const [error, setError] = useState("");

  const login = async (email, password) => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Sending as JSON payload
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();

      // Store data securely
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_role", data.role);

      // Role-based redirection
      if (data.role === "admin") {
        router.push("/admin/orders");
      } else {
        router.push("/admin/inventory");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const logout = async () => {
    try {
      // 1. (Optional) Inform backend
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error(
        "Logout cleanup on server failed, clearing local state anyway."
      );
    } finally {
      // 2. ALWAYS clear local storage regardless of server response
      localStorage.removeItem("token");
      localStorage.removeItem("user_role");

      // 3. Force redirect to public login
      window.location.href = "/login";
    }
  };

  return { login, logout, error };
};
