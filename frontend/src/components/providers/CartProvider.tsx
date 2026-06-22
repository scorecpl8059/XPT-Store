"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { CartContext, type CartContextType } from "@/hooks/use-cart";
import type { Cart, CartItem } from "@/types/cart";

const STORAGE_KEY = "xpt_cart";

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart on mount / when user changes
  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      if (user) {
        try {
          const data = await api.get<{ cart: Cart }>("/cart");
          const serverItems = data?.cart?.items || [];

          // Merge guest cart into server cart
          const localItems = getLocalCart();
          if (localItems.length > 0) {
            const merged = [...serverItems];
            for (const local of localItems) {
              const exists = merged.find(
                (i) =>
                  i.productId === local.productId &&
                  i.variantId === local.variantId
              );
              if (exists) {
                exists.quantity += local.quantity;
              } else {
                merged.push(local);
              }
            }
            // Save merged cart to server
            await api.put<Cart>("/cart", { items: merged });
            localStorage.removeItem(STORAGE_KEY);
            setItems(merged);
          } else {
            setItems(serverItems);
          }
        } catch {
          setItems(getLocalCart());
        }
      } else {
        setItems(getLocalCart());
      }
      setLoading(false);
    }

    loadCart();
  }, [user]);

  const syncCart = useCallback(
    async (newItems: CartItem[]) => {
      setItems(newItems);
      if (user) {
        try {
          await api.put<Cart>("/cart", { items: newItems });
        } catch {
          // Fallback to local
          setLocalCart(newItems);
        }
      } else {
        setLocalCart(newItems);
      }
    },
    [user]
  );

  const addItem = useCallback(
    async (productId: string, variantId?: string, quantity = 1) => {
      const newItems = [...items];
      const existing = newItems.find(
        (i) => i.productId === productId && i.variantId === variantId
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        newItems.push({
          productId,
          variantId,
          quantity,
          addedAt: new Date().toISOString(),
        });
      }
      await syncCart(newItems);
    },
    [items, syncCart]
  );

  const removeItem = useCallback(
    async (productId: string, variantId?: string) => {
      const newItems = items.filter(
        (i) =>
          !(i.productId === productId && i.variantId === variantId)
      );
      await syncCart(newItems);
    },
    [items, syncCart]
  );

  const updateQuantity = useCallback(
    async (
      productId: string,
      variantId: string | undefined,
      quantity: number
    ) => {
      if (quantity <= 0) {
        return removeItem(productId, variantId);
      }
      const newItems = items.map((i) =>
        i.productId === productId && i.variantId === variantId
          ? { ...i, quantity }
          : i
      );
      await syncCart(newItems);
    },
    [items, syncCart, removeItem]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) {
      try {
        await api.delete("/cart");
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext value={{ items, loading, itemCount, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext>
  );
}
