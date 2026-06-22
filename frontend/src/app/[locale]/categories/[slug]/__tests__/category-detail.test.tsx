import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CategoryPage from "../page";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

// Mock React.use() to synchronously unwrap the promise value
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    use: (promise: any) => {
      // In tests we pass an already-resolved-like object
      if (promise && typeof promise.then === "function") {
        // For our tests, params are simple objects wrapped in Promise.resolve
        // We'll handle this by passing the raw object in renderPage
        throw new Error("use() with real promises not supported in test");
      }
      return promise;
    },
  };
});

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

function makeCat(overrides: Partial<Category> = {}): Category {
  return {
    categoryId: "cat-1",
    name: "Sensors",
    slug: "sensors",
    description: "All types of sensors",
    sortOrder: 0,
    status: "active",
    productCount: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeProd(overrides: Partial<Product> = {}): Product {
  return {
    productId: "prod-1",
    name: "DHT22 Sensor",
    slug: "dht22",
    description: "",
    categoryId: "cat-1",
    basePrice: 5.99,
    weight: 0.01,
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

function renderPage(slug = "sensors") {
  // Pass raw object — our mocked React.use() returns it directly
  return render(<CategoryPage params={{ slug } as any} />);
}

describe("CategoryDetailPage", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders back to categories link", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("category.backToCategories")).toBeInTheDocument();
  });

  it("fetches category by slug and renders name", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/categories/sensors"))
        return Promise.resolve({ category: makeCat() });
      if (url === "/categories")
        return Promise.resolve({ categories: [] });
      return Promise.resolve({ items: [] });
    });

    renderPage("sensors");
    await waitFor(() => {
      expect(screen.getByText("Sensors")).toBeInTheDocument();
    });
  });

  it("renders category description", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/categories/sensors"))
        return Promise.resolve({
          category: makeCat({ description: "All types of sensors" }),
        });
      if (url === "/categories") return Promise.resolve({ categories: [] });
      return Promise.resolve({ items: [] });
    });

    renderPage("sensors");
    await waitFor(() => {
      expect(screen.getByText("All types of sensors")).toBeInTheDocument();
    });
  });

  it("renders subcategories as badges", async () => {
    const subs = [
      makeCat({ categoryId: "sub-1", name: "Temperature", slug: "temp", parentId: "cat-1" }),
      makeCat({ categoryId: "sub-2", name: "Humidity", slug: "humidity", parentId: "cat-1" }),
    ];
    mockGet.mockImplementation((url: string, params?: any) => {
      if (url.includes("/categories/sensors"))
        return Promise.resolve({ category: makeCat() });
      if (url === "/categories" && params?.parentId)
        return Promise.resolve({ categories: subs });
      if (url === "/categories")
        return Promise.resolve({ categories: [] });
      return Promise.resolve({ items: [] });
    });

    renderPage("sensors");
    await waitFor(() => {
      expect(screen.getByText(/Temperature/)).toBeInTheDocument();
      expect(screen.getByText(/Humidity/)).toBeInTheDocument();
    });
  });

  it("renders products in category", async () => {
    const products = [
      makeProd({ productId: "p1", name: "DHT22" }),
      makeProd({ productId: "p2", name: "BMP280" }),
    ];
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/categories/sensors"))
        return Promise.resolve({ category: makeCat() });
      if (url === "/categories")
        return Promise.resolve({ categories: [] });
      return Promise.resolve({ items: products });
    });

    renderPage("sensors");
    await waitFor(() => {
      expect(screen.getByTestId("product-p1")).toBeInTheDocument();
      expect(screen.getByTestId("product-p2")).toBeInTheDocument();
    });
  });

  it("shows empty message when no products", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/categories/sensors"))
        return Promise.resolve({ category: makeCat() });
      if (url === "/categories")
        return Promise.resolve({ categories: [] });
      return Promise.resolve({ items: [] });
    });

    renderPage("sensors");
    await waitFor(() => {
      expect(screen.getByText("category.noProducts")).toBeInTheDocument();
    });
  });

  it("handles category not found", async () => {
    mockGet.mockRejectedValue(new Error("Not found"));
    renderPage("nonexistent");
    await waitFor(() => {
      // Should still render without crashing
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });
  });

  it("shows loading skeletons while fetching", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
