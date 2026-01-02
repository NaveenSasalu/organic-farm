"use client";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    } else {
      setAuthorized(true);
    }
  }, []);

  // Hide the content entirely until we know they have a token
  if (!authorized) return null;

  return <>{children}</>;
}
