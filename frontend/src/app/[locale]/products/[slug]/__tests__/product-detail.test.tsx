import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Product, Variant } from "@/types/product";

// Mock React.use() for async params
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    use: (val: any) => val,
  };
});

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, unknown>) => {
    const full = `${ns}.${key}`;
    if (values)
      return Object.entries(values).reduce(
        (s, [k, v]) => s.replace(`{${k}}`, String(v)),
        full
      );
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

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { userId: "u1", name: "Test" } }),
}));

vi.mock("@/components/product/ProductReviews", () => ({
  ProductReviews: ({ productId }: any) => (
    <div data-testid="reviews">{productId}</div>
  ),
}));

vi.mock("@/components/product/ReviewForm", () => ({
  ReviewForm: () => <div data-testid="review-form" />,
}));

vi.mock("@/components/product/RelatedProducts", () => ({
  RelatedProducts: ({ productIds }: any) => (
    <div data-testid="related">{productIds.length} related</div>
  ),
}));

const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}));

import ProductDetailPage from "../page";

function makeProd(overrides: Partial<Product> = {}): Product & { variants: Variant[] } {
  return {
    productId: "prod-1",
    name: "Arduino Uno R4",
    slug: "arduino-uno-r4",
    description: "<p>A great board</p>",
    categoryId: "cat-1",
    basePrice: 24.99,
    weight: 0.1,
    images: ["https://cdn.example.com/img1.jpg"],
    status: "active",
    hasVariants: false,
    relatedProductIds: [],
    averageRating: 4.5,
    reviewCount: 12,
    totalSold: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    variants: [],
    ...overrides,
  } as any;
}

function renderPage(slug = "arduino-uno-r4") {
  return render(<ProductDetailPage params={{ slug } as any} />);
}

describe("ProductDetailPage", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("shows loading skeleton initially", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders product name and price", async () => {
    mockGet.mockResolvedValue(makeProd());
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Arduino Uno R4")).toBeInTheDocument();
      expect(screen.getByText("$24.99")).toBeInTheDocument();
    });
  });

  it("renders product description as HTML", async () => {
    mockGet.mockResolvedValue(makeProd({ description: "<p>Test description</p>" }));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Test description")).toBeInTheDocument();
    });
  });

  it("renders star rating when reviews exist", async () => {
    mockGet.mockResolvedValue(makeProd({ averageRating: 4.5, reviewCount: 12 }));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    });
  });

  it("renders add to cart button", async () => {
    mockGet.mockResolvedValue(makeProd());
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("product.addToCart")).toBeInTheDocument();
    });
  });

  it("shows not found when product doesn't exist", async () => {
    mockGet.mockResolvedValue(null);
    renderPage("nonexistent");

    await waitFor(() => {
      expect(screen.getByText("common.noResults")).toBeInTheDocument();
    });
  });

  it("renders quantity controls", async () => {
    mockGet.mockResolvedValue(makeProd());
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
      expect(screen.getByText("+")).toBeInTheDocument();
    });
  });

  it("increments and decrements quantity", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(makeProd());
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    await user.click(screen.getByText("+"));
    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByText("-"));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does not go below quantity 1", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(makeProd());
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    await user.click(screen.getByText("-"));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders reviews section", async () => {
    mockGet.mockResolvedValue(makeProd());
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("reviews")).toBeInTheDocument();
    });
  });

  it("renders related products when present", async () => {
    mockGet.mockResolvedValue(
      makeProd({ relatedProductIds: ["p2", "p3"] })
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("related")).toBeInTheDocument();
      expect(screen.getByText("2 related")).toBeInTheDocument();
    });
  });

  it("hides related products when none", async () => {
    mockGet.mockResolvedValue(makeProd({ relatedProductIds: [] }));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Arduino Uno R4")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("related")).not.toBeInTheDocument();
  });

  it("renders back link", async () => {
    mockGet.mockResolvedValue(makeProd());
    renderPage();

    await waitFor(() => {
      const backLink = screen.getByText("common.back").closest("a");
      expect(backLink).toHaveAttribute("href", "/products");
    });
  });

  it("shows specs when product has weight", async () => {
    mockGet.mockResolvedValue(makeProd({ weight: 0.5 }));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("product.specifications")).toBeInTheDocument();
      expect(screen.getByText("0.5 lbs")).toBeInTheDocument();
    });
  });
});
