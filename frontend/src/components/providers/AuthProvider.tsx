"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { AuthContext, type AuthUser, type RegisterData } from "@/hooks/use-auth";

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<AuthUser>("/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post<AuthResponse>("/auth/register", data);
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  return (
    <AuthContext value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext>
  );
}
