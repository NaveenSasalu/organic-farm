"use client"; // Critical for Next.js App Router

import React, { useState } from "react";
import { useAuth } from "@/lib/useAuth"; // Adjust path based on your setup

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
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        {localError && <p className="error-text">{localError}</p>}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />

        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
