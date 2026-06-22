import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CategoriesPage from "../page";
import type { Category } from "@/types/category";

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

const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}));

function makeCat(overrides: Partial<Category> = {}): Category {
  return {
    categoryId: "cat-1",
    name: "Microcontrollers",
    slug: "microcontrollers",
    description: "MCU boards",
    sortOrder: 0,
    status: "active",
    productCount: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("CategoriesPage", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders page title and description", async () => {
    mockGet.mockResolvedValue({ categories: [] });
    render(<CategoriesPage />);
    expect(screen.getByText("category.title")).toBeInTheDocument();
    expect(screen.getByText("category.description")).toBeInTheDocument();
  });

  it("shows loading skeletons initially", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<CategoriesPage />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders top-level categories", async () => {
    const cats = [
      makeCat({ categoryId: "c1", name: "Sensors", slug: "sensors" }),
      makeCat({ categoryId: "c2", name: "Cables", slug: "cables" }),
    ];
    mockGet.mockResolvedValue({ categories: cats });

    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText("Sensors")).toBeInTheDocument();
      expect(screen.getByText("Cables")).toBeInTheDocument();
    });
  });

  it("renders subcategories under their parent", async () => {
    const cats = [
      makeCat({ categoryId: "c1", name: "Sensors", slug: "sensors" }),
      makeCat({
        categoryId: "c2",
        name: "Temperature",
        slug: "temperature",
        parentId: "c1",
        productCount: 5,
      }),
    ];
    mockGet.mockResolvedValue({ categories: cats });

    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText("Sensors")).toBeInTheDocument();
      expect(screen.getByText("Temperature")).toBeInTheDocument();
    });
  });

  it("links categories to their slug page", async () => {
    mockGet.mockResolvedValue({
      categories: [makeCat({ slug: "sensors", name: "Sensors" })],
    });

    render(<CategoriesPage />);
    await waitFor(() => {
      const link = screen.getByText("Sensors").closest("a");
      expect(link).toHaveAttribute("href", "/categories/sensors");
    });
  });

  it("filters out inactive categories", async () => {
    const cats = [
      makeCat({ categoryId: "c1", name: "Visible", status: "active" }),
      makeCat({ categoryId: "c2", name: "Hidden", status: "inactive" }),
    ];
    mockGet.mockResolvedValue({ categories: cats });

    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText("Visible")).toBeInTheDocument();
    });
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("shows product count for each category", async () => {
    mockGet.mockResolvedValue({
      categories: [makeCat({ productCount: 15 })],
    });

    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText("product.products")).toBeInTheDocument();
    });
  });

  it("shows category description when available", async () => {
    mockGet.mockResolvedValue({
      categories: [makeCat({ description: "MCU boards" })],
    });

    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText("MCU boards")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    render(<CategoriesPage />);
    // Should render without crashing
    await waitFor(() => {
      expect(screen.getByText("category.title")).toBeInTheDocument();
    });
  });
});
