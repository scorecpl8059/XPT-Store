import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchFilters } from "../SearchFilters";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock API
vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

import { api } from "@/lib/api";
const mockGet = vi.mocked(api.get);

// Mock WsCard components
vi.mock("@/components/ui/cyber-card", () => ({
  WsCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ws-card">{children}</div>
  ),
  WsCardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="ws-card-content" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/cyber-button", () => ({
  WsButton: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe("SearchFilters", () => {
  const defaultProps = {
    selectedCategory: null as string | null,
    minPrice: "",
    maxPrice: "",
    onCategoryChange: vi.fn(),
    onMinPriceChange: vi.fn(),
    onMaxPriceChange: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onCategoryChange.mockReset();
    defaultProps.onMinPriceChange.mockReset();
    defaultProps.onMaxPriceChange.mockReset();
    defaultProps.onClear.mockReset();
    mockGet.mockReset();
    mockGet.mockResolvedValue({
      categories: [
        {
          categoryId: "cat-1",
          name: "Microcontrollers",
          slug: "microcontrollers",
          sortOrder: 0,
          status: "active",
          productCount: 10,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          categoryId: "cat-2",
          name: "Sensors",
          slug: "sensors",
          sortOrder: 1,
          status: "active",
          productCount: 5,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          categoryId: "cat-3",
          name: "Archived",
          slug: "archived",
          sortOrder: 2,
          status: "inactive",
          productCount: 0,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
  });

  it("renders the Filters header", () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("renders the all products button", () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText("allProducts")).toBeInTheDocument();
  });

  it("fetches and displays active categories", async () => {
    render(<SearchFilters {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Microcontrollers")).toBeInTheDocument();
      expect(screen.getByText("Sensors")).toBeInTheDocument();
    });

    // Inactive category should NOT be shown
    expect(screen.queryByText("Archived")).not.toBeInTheDocument();
  });

  it("calls onCategoryChange with categoryId when category is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Microcontrollers")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Microcontrollers"));
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith("cat-1");
  });

  it("calls onCategoryChange with null when all products is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SearchFilters {...defaultProps} selectedCategory="cat-1" />
    );

    await user.click(screen.getByText("allProducts"));
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(null);
  });

  it("renders price range inputs", () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText("Min")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max")).toBeInTheDocument();
  });

  it("calls onMinPriceChange when min price input changes", async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);
    const minInput = screen.getByPlaceholderText("Min");
    await user.type(minInput, "10");
    expect(defaultProps.onMinPriceChange).toHaveBeenCalled();
  });

  it("calls onMaxPriceChange when max price input changes", async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);
    const maxInput = screen.getByPlaceholderText("Max");
    await user.type(maxInput, "50");
    expect(defaultProps.onMaxPriceChange).toHaveBeenCalled();
  });

  it("shows clear button when filters are active", () => {
    render(
      <SearchFilters {...defaultProps} selectedCategory="cat-1" />
    );
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("does not show clear button when no filters are active", () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("shows clear button when minPrice is set", () => {
    render(<SearchFilters {...defaultProps} minPrice="10" />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("shows clear button when maxPrice is set", () => {
    render(<SearchFilters {...defaultProps} maxPrice="100" />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("calls onClear when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SearchFilters {...defaultProps} selectedCategory="cat-1" />
    );
    await user.click(screen.getByText("Clear"));
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    render(<SearchFilters {...defaultProps} />);

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.getByText("Filters")).toBeInTheDocument();
    });
  });
});
