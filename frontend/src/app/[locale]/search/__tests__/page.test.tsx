import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock i18n navigation
const mockPush = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={typeof href === "string" ? href : "/"}>{children}</a>,
}));

// Mock use-search
const mockUseSearch = vi.fn();
vi.mock("@/hooks/use-search", () => ({
  useSearch: (...args: unknown[]) => mockUseSearch(...args),
}));

// Mock layout components
vi.mock("@/components/layout/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

// Mock SearchFilters
vi.mock("@/components/search/SearchFilters", () => ({
  SearchFilters: () => <div data-testid="search-filters">Filters</div>,
}));

// Mock ProductCard
vi.mock("@/components/product/ProductCard", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

// Mock cyber-button
vi.mock("@/components/ui/cyber-button", () => ({
  WsButton: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

import SearchPage from "../page";

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue("arduino");
    mockUseSearch.mockReturnValue({ results: null, loading: false });
  });

  it("renders the search page with header and footer", () => {
    render(<SearchPage />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("shows the query in the results description", () => {
    render(<SearchPage />);
    expect(screen.getByText(/arduino/)).toBeInTheDocument();
  });

  it("shows loading skeletons when loading", () => {
    mockUseSearch.mockReturnValue({ results: null, loading: true });
    const { container } = render(<SearchPage />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows no results message when search returns empty", () => {
    mockUseSearch.mockReturnValue({
      results: { items: [], total: 0, page: 1, size: 20 },
      loading: false,
    });
    render(<SearchPage />);
    expect(screen.getByText("noResultsTitle")).toBeInTheDocument();
  });

  it("renders product cards for search results", () => {
    mockUseSearch.mockReturnValue({
      results: {
        items: [
          {
            productId: "p1",
            name: "Arduino Uno",
            description: "Board",
            basePrice: 25,
            categoryId: "c1",
            score: 1,
          },
          {
            productId: "p2",
            name: "Raspberry Pi",
            description: "Board",
            basePrice: 45,
            categoryId: "c1",
            score: 0.9,
          },
        ],
        total: 2,
        page: 1,
        size: 20,
      },
      loading: false,
    });

    render(<SearchPage />);
    const cards = screen.getAllByTestId("product-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("Arduino Uno")).toBeInTheDocument();
    expect(screen.getByText("Raspberry Pi")).toBeInTheDocument();
  });

  it("shows pagination when total exceeds page size", () => {
    mockUseSearch.mockReturnValue({
      results: {
        items: [
          {
            productId: "p1",
            name: "Test",
            description: "",
            basePrice: 10,
            categoryId: "c1",
            score: 1,
          },
        ],
        total: 40,
        page: 1,
        size: 20,
      },
      loading: false,
    });

    render(<SearchPage />);
    expect(screen.getByText("next")).toBeInTheDocument();
    expect(screen.getByText("back")).toBeInTheDocument();
  });

  it("passes correct options to useSearch", () => {
    render(<SearchPage />);
    expect(mockUseSearch).toHaveBeenCalledWith(
      "arduino",
      expect.objectContaining({
        page: 1,
        size: 20,
      })
    );
  });

  it("submits search form and navigates", () => {
    render(<SearchPage />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "sensor" } });
    fireEvent.submit(input.closest("form")!);
    expect(mockPush).toHaveBeenCalledWith("/search?q=sensor");
  });

  it("shows prompt when no query", () => {
    mockGet.mockReturnValue("");
    render(<SearchPage />);
    expect(screen.getByText("noResultsDesc")).toBeInTheDocument();
  });

  it("renders search filters", () => {
    render(<SearchPage />);
    expect(screen.getByTestId("search-filters")).toBeInTheDocument();
  });
});
