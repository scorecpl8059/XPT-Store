"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  accountType: "individual" | "business";
  companyName?: string;
  avatar?: string;
  preferredLanguage: "en" | "zh-CN";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  name: string;
  password: string;
  accountType?: "individual" | "business";
  companyName?: string;
  taxId?: string;
  phone?: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { AuthContext };
export type { AuthUser, AuthContextType, RegisterData };
