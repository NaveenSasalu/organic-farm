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
  KeyRound,
  Trash2,
  UserPlus,
  Copy,
  X,
  AlertCircle,
} from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", role: "farmer" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Reset password modal
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copied indicator
  const [copied, setCopied] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
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
    // Get current user email to prevent self-delete
    const fetchMe = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserEmail(data.email);
        }
      } catch {}
    };
    fetchMe();
  }, [fetchUsers]);

  const toggleRole = async (userId: number, currentRole: string) => {
    const token = localStorage.getItem("token");
    const newRole = currentRole === "admin" ? "farmer" : "admin";

    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${userId}/role?role=${newRole}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Failed to update role.");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create user");
      }

      setShowCreateModal(false);
      setCreateForm({ email: "", password: "", role: "farmer" });
      fetchUsers();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    setResetLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Failed to reset password");
        return;
      }

      const data = await res.json();
      setTempPassword(data.temporary_password);
      setResetUserId(null);
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setDeleteLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Failed to delete user");
        return;
      }

      setDeleteUserId(null);
      fetchUsers();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8 text-stone-900">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black text-stone-900 tracking-tighter italic">
            STAFF & PERMISSIONS
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-stone-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-stone-800 transition"
          >
            <UserPlus size={20} /> Add User
          </button>
        </div>
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
                {users.map((user: any) => {
                  const isSelf = user.email === currentUserEmail;
                  return (
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
                              {isSelf && (
                                <span className="ml-2 text-[10px] text-stone-400 uppercase">(you)</span>
                              )}
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
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toggleRole(user.id, user.role)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-green-800 transition active:scale-95"
                            title={`Change to ${user.role === "admin" ? "Farmer" : "Admin"}`}
                          >
                            <RefreshCcw size={14} />
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => setResetUserId(user.id)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-amber-700 transition active:scale-95"
                                title="Reset Password"
                              >
                                <KeyRound size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteUserId(user.id)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-red-600 transition active:scale-95"
                                title="Delete User"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-stone-900">Create User</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-2xl text-sm font-bold border border-red-100">
                <AlertCircle size={16} /> {createError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Email</label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600"
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Password</label>
              <input
                type="password"
                required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Min 8 chars"
                minLength={8}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="farmer">Farmer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-4 font-bold text-stone-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="flex-1 py-4 bg-green-800 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createLoading ? <><Loader2 className="animate-spin" size={18} /> Creating...</> : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Confirmation */}
      {resetUserId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-4 text-center">
            <KeyRound size={32} className="mx-auto text-amber-600" />
            <h3 className="text-xl font-bold text-stone-900">Reset Password?</h3>
            <p className="text-sm text-stone-500">
              This will generate a new temporary password for this user. They will need to use it to log in.
            </p>
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setResetUserId(null)}
                className="flex-1 py-3 font-bold text-stone-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetPassword(resetUserId)}
                disabled={resetLoading}
                className="flex-1 py-3 bg-amber-600 text-white rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetLoading ? <Loader2 className="animate-spin" size={18} /> : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temp Password Display */}
      {tempPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-4 text-center">
            <ShieldCheck size={32} className="mx-auto text-green-700" />
            <h3 className="text-xl font-bold text-stone-900">Password Reset</h3>
            <p className="text-sm text-stone-500">Share this temporary password with the user:</p>
            <div className="flex items-center justify-center gap-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <code className="text-lg font-mono font-bold text-stone-800 select-all">{tempPassword}</code>
              <button
                onClick={() => copyToClipboard(tempPassword)}
                className="text-stone-400 hover:text-green-700 transition"
                title="Copy"
              >
                <Copy size={18} />
              </button>
            </div>
            {copied && <p className="text-xs text-green-600 font-bold">Copied!</p>}
            <button
              onClick={() => setTempPassword(null)}
              className="w-full py-3 bg-stone-900 text-white rounded-2xl font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteUserId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-4 text-center">
            <Trash2 size={32} className="mx-auto text-red-500" />
            <h3 className="text-xl font-bold text-stone-900">Delete User?</h3>
            <p className="text-sm text-stone-500">
              This action cannot be undone. The user will be permanently removed.
            </p>
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setDeleteUserId(null)}
                className="flex-1 py-3 font-bold text-stone-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteUserId)}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 className="animate-spin" size={18} /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
