"use client";
import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import {
  Shield,
  User as UserIcon,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const res = await fetch("https://of.kaayaka.in/api/v1/users/", {
      credentials: "include",
    });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "farmer" : "admin";
    const res = await fetch(
      `https://of.kaayaka.in/api/v1/users/${userId}/role?role=${newRole}`,
      {
        method: "PATCH",
        credentials: "include",
      }
    );
    if (res.ok) fetchUsers();
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-stone-900 mb-6">
          Staff & Permissions
        </h1>
        <AdminNav />

        <div className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm">
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
            <tbody>
              {users.map((user: any) => (
                <tr
                  key={user.id}
                  className="border-b border-stone-50 hover:bg-stone-50/50 transition"
                >
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
                        <p className="font-bold text-stone-800">{user.email}</p>
                        <p className="text-xs text-stone-400">ID: #{user.id}</p>
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
                      className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-green-800 transition"
                    >
                      <RefreshCcw size={14} /> Change to{" "}
                      {user.role === "admin" ? "Farmer" : "Admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
