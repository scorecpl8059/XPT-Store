import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HomePage from "../page";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

// Mocks
vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, unknown>) => {
    const full = `${ns}.${key}`;
    if (values) {
      return Object.entries(values).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, String(v)),
        full
      );
    }
    return full;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <header data-testid="header" />,
}));

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer" />,
}));

vi.mock("@/components/product/ProductCard", () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-${product.productId}`}>{product.name}</div>
  ),
}));

const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}));

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    categoryId: "cat-1",
    name: "Microcontrollers",
    slug: "microcontrollers",
    status: "active",
    productCount: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    productId: "prod-1",
    name: "Arduino Uno",
    slug: "arduino-uno",
    description: "",
    categoryId: "cat-1",
    basePrice: 24.99,
    weight: 0.1,
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

describe("HomePage", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders header and footer", async () => {
    mockGet.mockResolvedValue({ categories: [], items: [] });
    render(<HomePage />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders hero section with title and CTA buttons", async () => {
    mockGet.mockResolvedValue({ categories: [], items: [] });
    render(<HomePage />);
    expect(screen.getByText("home.title")).toBeInTheDocument();
    expect(screen.getByText("home.subtitle")).toBeInTheDocument();
    expect(screen.getByText("home.browseProducts")).toBeInTheDocument();
    expect(screen.getByText("home.requestQuote")).toBeInTheDocument();
  });

  it("renders categories from API", async () => {
    const cats = [
      makeCategory({ categoryId: "c1", name: "Sensors", slug: "sensors" }),
      makeCategory({ categoryId: "c2", name: "Cables", slug: "cables" }),
    ];
    mockGet.mockImplementation((url: string) => {
      if (url === "/categories") return Promise.resolve({ categories: cats });
      return Promise.resolve({ items: [] });
    });

    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText("Sensors")).toBeInTheDocument();
      expect(screen.getByText("Cables")).toBeInTheDocument();
    });
  });

  it("filters out inactive categories", async () => {
    const cats = [
      makeCategory({ categoryId: "c1", name: "Active", status: "active" }),
      makeCategory({ categoryId: "c2", name: "Hidden", status: "inactive" }),
    ];
    mockGet.mockImplementation((url: string) => {
      if (url === "/categories") return Promise.resolve({ categories: cats });
      return Promise.resolve({ items: [] });
    });

    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders new arrivals when products exist", async () => {
    const products = [
      makeProduct({ productId: "p1", name: "ESP32" }),
      makeProduct({ productId: "p2", name: "Raspberry Pi" }),
    ];
    mockGet.mockImplementation((url: string) => {
      if (url === "/categories") return Promise.resolve({ categories: [] });
      return Promise.resolve({ items: products });
    });

    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByTestId("product-p1")).toBeInTheDocument();
      expect(screen.getByTestId("product-p2")).toBeInTheDocument();
    });
  });

  it("hides new arrivals section when no products", async () => {
    mockGet.mockResolvedValue({ categories: [], items: [] });
    render(<HomePage />);
    // Wait for fetch to complete
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });
    expect(screen.queryByText("home.newArrivals")).not.toBeInTheDocument();
  });

  it("renders why-us section with 4 reasons", () => {
    mockGet.mockResolvedValue({ categories: [], items: [] });
    render(<HomePage />);
    expect(screen.getByText("home.whyUs")).toBeInTheDocument();
    expect(screen.getByText("home.reason1Title")).toBeInTheDocument();
    expect(screen.getByText("home.reason2Title")).toBeInTheDocument();
    expect(screen.getByText("home.reason3Title")).toBeInTheDocument();
    expect(screen.getByText("home.reason4Title")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    render(<HomePage />);
    // Should still render the page structure without crashing
    await waitFor(() => {
      expect(screen.getByText("home.title")).toBeInTheDocument();
    });
  });

  it("links browse products to /products", () => {
    mockGet.mockResolvedValue({ categories: [], items: [] });
    render(<HomePage />);
    const browseLink = screen.getByText("home.browseProducts").closest("a");
    expect(browseLink).toHaveAttribute("href", "/products");
  });

  it("links request quote to /rfq", () => {
    mockGet.mockResolvedValue({ categories: [], items: [] });
    render(<HomePage />);
    const rfqLink = screen.getByText("home.requestQuote").closest("a");
    expect(rfqLink).toHaveAttribute("href", "/rfq");
  });
});
