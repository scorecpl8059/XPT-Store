import { vi } from "vitest";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

// Mock next-intl
export function mockNextIntl() {
  vi.mock("next-intl", () => ({
    useTranslations: (namespace: string) => {
      return (key: string, values?: Record<string, unknown>) => {
        const full = `${namespace}.${key}`;
        if (values) {
          return Object.entries(values).reduce(
            (str, [k, v]) => str.replace(`{${k}}`, String(v)),
            full
          );
        }
        return full;
      };
    },
  }));
}

// Mock i18n navigation
export function mockNavigation() {
  vi.mock("@/i18n/navigation", () => ({
    Link: ({
      href,
      children,
      className,
      ...props
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
    }) => {
      const React = require("react");
      return React.createElement("a", { href, className, ...props }, children);
    },
  }));
}

// Mock API
export function mockApi() {
  const get = vi.fn();
  const post = vi.fn();
  const put = vi.fn();
  const del = vi.fn();

  vi.mock("@/lib/api", () => ({
    api: { get, post, put, delete: del },
  }));

  return { get, post, put, delete: del };
}

// Sample data factories
export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    productId: "prod-1",
    name: "Arduino Uno R4",
    slug: "arduino-uno-r4",
    description: "<p>A great microcontroller board</p>",
    categoryId: "cat-1",
    basePrice: 24.99,
    weight: 0.1,
    images: ["https://cdn.example.com/arduino.jpg"],
    status: "active",
    hasVariants: false,
    stock: 50,
    relatedProductIds: [],
    averageRating: 4.5,
    reviewCount: 12,
    totalSold: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    categoryId: "cat-1",
    name: "Microcontrollers",
    slug: "microcontrollers",
    description: "MCU boards and kits",
    status: "active",
    productCount: 15,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
