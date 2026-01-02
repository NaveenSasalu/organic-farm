"use client";
import { useEffect, useState, useCallback } from "react";
import AdminNav from "@/components/AdminNav";
import { API_BASE_URL } from "@/lib/api";
import {
  Shield,
  User as UserIcon,
  ShieldCheck,
  RefreshCcw,
  Loader2,
} from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      // 1. Explicitly use HTTPS and remove trailing slash if needed
      // 2. Pass the Authorization header instead of just credentials
      const res = await fetch(`${API_BASE_URL}/api/v1/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        console.error("Unauthorized: Redirecting to login");
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleRole = async (userId: number, currentRole: string) => {
    const token = localStorage.getItem("token");
    const newRole = currentRole === "admin" ? "farmer" : "admin";

    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${userId}/role?role=${newRole}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        fetchUsers();
      } else {
        alert("Failed to update role. Ensure you have admin privileges.");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8 text-stone-900">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-stone-900 mb-6 tracking-tighter italic">
          STAFF & PERMISSIONS
        </h1>
        <AdminNav />

        <div className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm min-h-[300px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-stone-300" size={32} />
            </div>
          ) : users.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12 text-stone-400">
              No users found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="p-6 text-[10px] font-black uppercase text-stone-400">
                    User
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase text-stone-400">
                    Current Role
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase text-stone-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-stone-50/50 transition">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                          {user.role === "admin" ? (
                            <ShieldCheck size={20} className="text-green-700" />
                          ) : (
                            <UserIcon size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800">
                            {user.email}
                          </p>
                          <p className="text-xs text-stone-400">
                            ID: #{user.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          user.role === "admin"
                            ? "bg-green-100 text-green-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-green-800 transition active:scale-95"
                      >
                        <RefreshCcw size={14} /> Change to{" "}
                        {user.role === "admin" ? "Farmer" : "Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
