"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import { useAuth } from "./use-auth";
import type { CartItem } from "@/types/cart";

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const STORAGE_KEY = "xpt_cart";

const CartContext = createContext<CartContextType | null>(null);

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

function getLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export { CartContext };
export type { CartContextType };
