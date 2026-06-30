import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductsPage from "../page";
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

function makeCat(overrides: Partial<Category> = {}): Category {
  return {
    categoryId: "cat-1",
    name: "Sensors",
    slug: "sensors",
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
    name: "ESP32",
    slug: "esp32",
    description: "",
    categoryId: "cat-1",
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

describe("ProductsPage", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders page title", async () => {
    mockGet.mockResolvedValue({ items: [], categories: [] });
    render(<ProductsPage />);
    expect(
      screen.getByRole("heading", { name: "category.allProducts" })
    ).toBeInTheDocument();
  });

  it("renders products from API", async () => {
    const products = [
      makeProd({ productId: "p1", name: "ESP32" }),
      makeProd({ productId: "p2", name: "STM32" }),
    ];
    mockGet.mockImplementation((url: string) => {
      if (url === "/products") return Promise.resolve({ items: products });
      return Promise.resolve({ categories: [] });
    });

    render(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("product-p1")).toBeInTheDocument();
      expect(screen.getByTestId("product-p2")).toBeInTheDocument();
    });
  });

  it("renders category filter sidebar", async () => {
    const cats = [
      makeCat({ categoryId: "c1", name: "Sensors" }),
      makeCat({ categoryId: "c2", name: "Cables" }),
    ];
    mockGet.mockImplementation((url: string) => {
      if (url === "/categories") return Promise.resolve({ categories: cats });
      return Promise.resolve({ items: [] });
    });

    render(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText("Sensors")).toBeInTheDocument();
      expect(screen.getByText("Cables")).toBeInTheDocument();
    });
  });

  it("filters products by category on click", async () => {
    const user = userEvent.setup();
    const cats = [makeCat({ categoryId: "c1", name: "Sensors" })];

    mockGet.mockImplementation((url: string) => {
      if (url === "/categories") return Promise.resolve({ categories: cats });
      return Promise.resolve({ items: [] });
    });

    render(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText("Sensors")).toBeInTheDocument();
    });

    // Click on category filter
    await user.click(screen.getByText("Sensors"));

    // Should re-fetch with categoryId
    await waitFor(() => {
      const productCalls = mockGet.mock.calls.filter(
        (c: any[]) => c[0] === "/products"
      );
      const lastCall = productCalls[productCalls.length - 1];
      expect(lastCall[1]).toEqual(
        expect.objectContaining({ categoryId: "c1" })
      );
    });
  });

  it("shows no results message when empty", async () => {
    mockGet.mockResolvedValue({ items: [], categories: [] });
    render(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText("common.noResults")).toBeInTheDocument();
    });
  });

  it("shows product count", async () => {
    const products = [makeProd({ productId: "p1" })];
    mockGet.mockImplementation((url: string) => {
      if (url === "/products") return Promise.resolve({ items: products });
      return Promise.resolve({ categories: [] });
    });

    render(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText(/common\.showing/)).toBeInTheDocument();
    });
  });

  it("shows loading skeletons while fetching", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ProductsPage />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("handles API errors gracefully", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    render(<ProductsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "category.allProducts" })
      ).toBeInTheDocument();
    });
  });

  it("clears category filter", async () => {
    const user = userEvent.setup();
    const cats = [makeCat({ categoryId: "c1", name: "Sensors" })];

    mockGet.mockImplementation((url: string) => {
      if (url === "/categories") return Promise.resolve({ categories: cats });
      return Promise.resolve({ items: [] });
    });

    render(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText("Sensors")).toBeInTheDocument();
    });

    // Select the Sensors category filter
    await user.click(screen.getByText("Sensors"));

    // Wait for fetch triggered by category selection
    await waitFor(() => {
      const productCalls = mockGet.mock.calls.filter(
        (c: any[]) => c[0] === "/products"
      );
      expect(productCalls.length).toBeGreaterThan(1);
    });

    // Click the "All Products" sidebar button to clear filter
    // There are two elements with this text: the h1 and the sidebar button
    const allButtons = screen.getAllByText("category.allProducts");
    const sidebarButton = allButtons.find((el) => el.tagName === "BUTTON");
    await user.click(sidebarButton!);

    // Verify the last /products call has no categoryId
    await waitFor(() => {
      const productCalls = mockGet.mock.calls.filter(
        (c: any[]) => c[0] === "/products"
      );
      const lastCall = productCalls[productCalls.length - 1];
      expect(lastCall[1]).toEqual({ status: "active" });
    });
  });
});
