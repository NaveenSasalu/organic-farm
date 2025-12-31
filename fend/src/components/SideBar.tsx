// src/components/Sidebar.tsx b
import { useAuth } from "@/lib/useAuth";

export const Sidebar = () => {
  const { logout } = useAuth();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("user_role") : null;

  return (
    <aside>
      <nav>
        <a href="/dashboard">Dashboard</a>
        {role === "admin" && <a href="/admin/farmers">Manage Farmers</a>}
        <a href="/admin/inventory">Inventory</a>

        {/* Use the shared logout logic */}
        <button onClick={logout} className="logout-btn">
          Log Out
        </button>
      </nav>
    </aside>
  );
};
