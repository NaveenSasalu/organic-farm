"use client"; // Critical for Next.js App Router

import React, { useState } from "react";

import { useAuth } from "@/lib/useAuth"; // Adjust path based on your setup
import LogPage from "@/components/login";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

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
    <div className="login-container">
      <LogPage />
    </div>
  );
}
