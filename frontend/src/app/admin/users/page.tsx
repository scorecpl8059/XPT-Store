"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { api } from "@/lib/api";
import { Users } from "lucide-react";

interface User {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  accountType: "individual" | "business";
  companyName?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (filter !== "all") params.role = filter;
      const res = await api.get<{ users: User[] }>("/users", params);
      setUsers(res.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ws-text">Users</h1>
          <p className="text-sm text-ws-text-muted">{users.length} users</p>
        </div>
        <div className="flex gap-1">
          {["all", "customer", "admin"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? "bg-ws-blue/10 text-ws-blue border border-ws-blue/20"
                  : "text-ws-text-muted hover:text-ws-text hover:bg-ws-surface border border-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ws-text-muted">Loading...</p>
      ) : users.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <Users className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">No users found</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="border border-ws-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ws-surface">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Joined</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-ws-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} className="border-t border-ws-border hover:bg-ws-surface/50">
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/users/${user.userId}`}
                      className="text-ws-blue hover:underline font-medium"
                    >
                      {user.name}
                    </a>
                    {user.companyName && (
                      <p className="text-xs text-ws-text-muted">{user.companyName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ws-text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    <WsBadge variant={user.accountType === "business" ? "blue" : "muted"}>
                      {user.accountType}
                    </WsBadge>
                  </td>
                  <td className="px-4 py-3">
                    <WsBadge variant={user.role === "admin" ? "purple" : "muted"}>
                      {user.role}
                    </WsBadge>
                  </td>
                  <td className="px-4 py-3 text-ws-text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/admin/users/${user.userId}`}
                      className="text-xs text-ws-blue hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
