import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../SearchBar";

// Mocks
const mockPush = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `nav.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("../SearchSuggestions", () => ({
  SearchSuggestions: ({
    query,
    onSelect,
    onViewAll,
  }: {
    query: string;
    onSelect: (slug: string) => void;
    onViewAll: () => void;
  }) => (
    <div data-testid="search-suggestions">
      <span data-testid="suggestion-query">{query}</span>
      <button data-testid="suggestion-item" onClick={() => onSelect("prod-1")}>
        Suggestion
      </button>
      <button data-testid="view-all" onClick={onViewAll}>
        View All
      </button>
    </div>
  ),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders the search input with placeholder", () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText("nav.search")).toBeInTheDocument();
  });

  it("updates input value on typing", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "arduino");
    expect(input).toHaveValue("arduino");
  });

  it("shows suggestions when query has 2+ characters", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "ar");
    expect(screen.getByTestId("search-suggestions")).toBeInTheDocument();
  });

  it("does not show suggestions for 1 character query", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "a");
    expect(screen.queryByTestId("search-suggestions")).not.toBeInTheDocument();
  });

  it("shows clear button when query is not empty", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");

    // No clear button initially
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    await user.type(input, "t");
    // Clear button appears (use getAllByRole since suggestions may add buttons)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("clears input when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "test");

    // Click clear button (the X button, not suggestion buttons)
    const clearButton = screen.getAllByRole("button")[0];
    await user.click(clearButton);

    expect(input).toHaveValue("");
  });

  it("navigates to search page on form submit", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "arduino{enter}");
    expect(mockPush).toHaveBeenCalledWith("/search?q=arduino");
  });

  it("does not navigate when query is empty on submit", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "{enter}");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to product on suggestion select", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "ar");

    await user.click(screen.getByTestId("suggestion-item"));
    expect(mockPush).toHaveBeenCalledWith("/products/prod-1");
  });

  it("navigates to search page on view all", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "ar");

    await user.click(screen.getByTestId("view-all"));
    expect(mockPush).toHaveBeenCalledWith("/search?q=ar");
  });

  it("calls onClose when provided after navigation", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onClose={onClose} />);
    const input = screen.getByPlaceholderText("nav.search");
    await user.type(input, "arduino{enter}");
    expect(onClose).toHaveBeenCalled();
  });

  it("applies custom className", () => {
    const { container } = render(<SearchBar className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
