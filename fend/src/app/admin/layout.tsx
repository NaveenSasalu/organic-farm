"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("user_role");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Protection: If a non-admin tries to access restricted pages
    const adminOnlyPaths = ["/admin/users", "/admin/farmers"];
    const isRestrictedPath = adminOnlyPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (isRestrictedPath && role !== "admin") {
      window.location.href = "/admin/inventory"; // Redirect farmer to their safe zone
      return;
    }

    setIsAuthorized(true);
  }, [pathname]);

  if (!isAuthorized) return null;

  return <>{children}</>;
}
