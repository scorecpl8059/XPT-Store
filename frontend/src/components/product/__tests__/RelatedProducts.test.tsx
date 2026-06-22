import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RelatedProducts } from "../RelatedProducts";
import type { Product } from "@/types/product";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}));

function makeProd(overrides: Partial<Product> = {}): Product {
  return {
    productId: "p1",
    name: "ESP32",
    slug: "esp32",
    description: "",
    categoryId: "c1",
    basePrice: 12.99,
    weight: 0.05,
    images: [],
    status: "active",
    hasVariants: false,
    relatedProductIds: [],
    averageRating: 0,
    reviewCount: 0,
    totalSold: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("RelatedProducts", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders nothing when no product IDs", () => {
    const { container } = render(<RelatedProducts productIds={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders related products", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === "/products/p1") return Promise.resolve(makeProd({ name: "ESP32" }));
      if (url === "/products/p2") return Promise.resolve(makeProd({ productId: "p2", name: "STM32" }));
      return Promise.resolve(null);
    });

    render(<RelatedProducts productIds={["p1", "p2"]} />);

    await waitFor(() => {
      expect(screen.getByText("product.relatedProducts")).toBeInTheDocument();
      expect(screen.getByText("ESP32")).toBeInTheDocument();
      expect(screen.getByText("STM32")).toBeInTheDocument();
    });
  });

  it("filters out non-active products", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === "/products/p1") return Promise.resolve(makeProd({ name: "Active" }));
      if (url === "/products/p2")
        return Promise.resolve(makeProd({ productId: "p2", name: "Draft", status: "draft" }));
      return Promise.resolve(null);
    });

    render(<RelatedProducts productIds={["p1", "p2"]} />);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    mockGet.mockRejectedValue(new Error("fail"));

    const { container } = render(<RelatedProducts productIds={["p1"]} />);

    // Wait a tick then check it didn't crash
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });
    // Should render nothing since no products loaded
    expect(container.querySelector("h2")).toBeNull();
  });
});
