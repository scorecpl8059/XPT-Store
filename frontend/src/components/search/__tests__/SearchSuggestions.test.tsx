import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchSuggestions } from "../SearchSuggestions";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock useSearch
const mockUseSearch = vi.fn();
vi.mock("@/hooks/use-search", () => ({
  useSearch: (...args: unknown[]) => mockUseSearch(...args),
}));

describe("SearchSuggestions", () => {
  const defaultProps = {
    query: "arduino",
    onSelect: vi.fn(),
    onViewAll: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onSelect.mockReset();
    defaultProps.onViewAll.mockReset();
    mockUseSearch.mockReset();
  });

  it("shows loading state", () => {
    mockUseSearch.mockReturnValue({ results: null, loading: true });
    render(<SearchSuggestions {...defaultProps} />);
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("shows no results message when results are null", () => {
    mockUseSearch.mockReturnValue({ results: null, loading: false });
    render(<SearchSuggestions {...defaultProps} />);
    expect(screen.getByText("noResults")).toBeInTheDocument();
  });

  it("shows no results message when items array is empty", () => {
    mockUseSearch.mockReturnValue({
      results: { items: [], total: 0, page: 1, size: 5 },
      loading: false,
    });
    render(<SearchSuggestions {...defaultProps} />);
    expect(screen.getByText("noResults")).toBeInTheDocument();
  });

  it("renders suggestion items", () => {
    mockUseSearch.mockReturnValue({
      results: {
        items: [
          { productId: "p1", name: "Arduino Uno", description: "", categoryId: "c1", basePrice: 24.99, score: 1 },
          { productId: "p2", name: "Arduino Mega", description: "", categoryId: "c1", basePrice: 39.99, score: 0.9 },
        ],
        total: 2,
        page: 1,
        size: 5,
      },
      loading: false,
    });

    render(<SearchSuggestions {...defaultProps} />);
    expect(screen.getByText("Arduino Uno")).toBeInTheDocument();
    expect(screen.getByText("Arduino Mega")).toBeInTheDocument();
    expect(screen.getByText("$24.99")).toBeInTheDocument();
    expect(screen.getByText("$39.99")).toBeInTheDocument();
  });

  it("calls onSelect with productId when suggestion is clicked", async () => {
    const user = userEvent.setup();
    mockUseSearch.mockReturnValue({
      results: {
        items: [
          { productId: "p1", name: "Arduino Uno", description: "", categoryId: "c1", basePrice: 24.99, score: 1 },
        ],
        total: 1,
        page: 1,
        size: 5,
      },
      loading: false,
    });

    render(<SearchSuggestions {...defaultProps} />);
    await user.click(screen.getByText("Arduino Uno"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("p1");
  });

  it("shows view all button when total exceeds displayed items", () => {
    mockUseSearch.mockReturnValue({
      results: {
        items: [
          { productId: "p1", name: "Arduino Uno", description: "", categoryId: "c1", basePrice: 24.99, score: 1 },
        ],
        total: 10,
        page: 1,
        size: 5,
      },
      loading: false,
    });

    render(<SearchSuggestions {...defaultProps} />);
    // The button contains "viewAll (10)" split across text nodes
    const viewAllButton = screen.getByRole("button", { name: /viewAll/ });
    expect(viewAllButton).toBeInTheDocument();
    expect(viewAllButton.textContent).toContain("10");
  });

  it("does not show view all button when all results are displayed", () => {
    mockUseSearch.mockReturnValue({
      results: {
        items: [
          { productId: "p1", name: "Arduino Uno", description: "", categoryId: "c1", basePrice: 24.99, score: 1 },
        ],
        total: 1,
        page: 1,
        size: 5,
      },
      loading: false,
    });

    render(<SearchSuggestions {...defaultProps} />);
    expect(screen.queryByText(/viewAll/)).not.toBeInTheDocument();
  });

  it("calls onViewAll when view all button is clicked", async () => {
    const user = userEvent.setup();
    mockUseSearch.mockReturnValue({
      results: {
        items: [
          { productId: "p1", name: "Arduino Uno", description: "", categoryId: "c1", basePrice: 24.99, score: 1 },
        ],
        total: 10,
        page: 1,
        size: 5,
      },
      loading: false,
    });

    render(<SearchSuggestions {...defaultProps} />);
    await user.click(screen.getByText(/viewAll/));
    expect(defaultProps.onViewAll).toHaveBeenCalled();
  });

  it("calls useSearch with query and size 5", () => {
    mockUseSearch.mockReturnValue({ results: null, loading: false });
    render(<SearchSuggestions {...defaultProps} />);
    expect(mockUseSearch).toHaveBeenCalledWith("arduino", { size: 5 });
  });
});
