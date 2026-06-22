import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CartPage from "../page";

// Mocks
const mockPush = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
const mockClearCart = vi.fn();
let mockItems: any[] = [];

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ children, href }: any) => (
    <a href={typeof href === "string" ? href : "/"}>{children}</a>
  ),
}));

vi.mock("@/hooks/use-cart", () => ({
  useCart: () => ({
    items: mockItems,
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
    clearCart: mockClearCart,
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      name: "Arduino Uno",
      images: [{ url: "/img.jpg" }],
      basePrice: 25.99,
    }),
  },
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("@/components/cart/CartItem", () => ({
  CartItem: ({ productName, onRemove, onUpdateQuantity }: any) => (
    <div data-testid="cart-item">
      <span>{productName || "Unknown"}</span>
      <button data-testid="remove-btn" onClick={onRemove}>
        Remove
      </button>
      <button data-testid="update-qty-btn" onClick={() => onUpdateQuantity(5)}>
        Update
      </button>
    </div>
  ),
}));

vi.mock("@/components/cart/CartSummary", () => ({
  CartSummary: ({ subtotal }: any) => (
    <div data-testid="cart-summary">Subtotal: ${subtotal.toFixed(2)}</div>
  ),
}));

vi.mock("@/components/ui/cyber-button", () => ({
  WsButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/ui/cyber-card", () => ({
  WsCard: ({ children }: any) => <div data-testid="ws-card">{children}</div>,
  WsCardContent: ({ children }: any) => <div>{children}</div>,
}));

describe("CartPage", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUpdateQuantity.mockReset();
    mockRemoveItem.mockReset();
    mockClearCart.mockReset();
    mockItems = [];
  });

  it("renders header and footer", () => {
    render(<CartPage />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders the page title", () => {
    render(<CartPage />);
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("shows empty state when cart has no items", () => {
    mockItems = [];
    render(<CartPage />);
    expect(screen.getByText("empty")).toBeInTheDocument();
    expect(screen.getByText("continueShopping")).toBeInTheDocument();
  });

  it("renders cart items when cart has items", () => {
    mockItems = [
      { productId: "prod-1", quantity: 2, addedAt: "2026-01-01T00:00:00Z" },
      { productId: "prod-2", quantity: 1, addedAt: "2026-01-02T00:00:00Z" },
    ];
    render(<CartPage />);
    const items = screen.getAllByTestId("cart-item");
    expect(items).toHaveLength(2);
  });

  it("renders cart summary sidebar when cart has items", () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    render(<CartPage />);
    expect(screen.getByTestId("cart-summary")).toBeInTheDocument();
  });

  it("renders checkout button when cart has items", () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    render(<CartPage />);
    expect(screen.getByText("checkout")).toBeInTheDocument();
  });

  it("navigates to checkout when checkout button is clicked", async () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    const user = userEvent.setup();
    render(<CartPage />);
    await user.click(screen.getByText("checkout"));
    expect(mockPush).toHaveBeenCalledWith("/checkout");
  });

  it("renders continue shopping link when cart has items", () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    render(<CartPage />);
    // There are two continueShopping elements - the link text in the sidebar
    const links = screen.getAllByText("continueShopping");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("calls removeItem when remove button is clicked on a cart item", async () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    const user = userEvent.setup();
    render(<CartPage />);
    await user.click(screen.getByTestId("remove-btn"));
    expect(mockRemoveItem).toHaveBeenCalledWith("prod-1", undefined);
  });

  it("calls updateQuantity when update button is clicked on a cart item", async () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    const user = userEvent.setup();
    render(<CartPage />);
    await user.click(screen.getByTestId("update-qty-btn"));
    expect(mockUpdateQuantity).toHaveBeenCalledWith("prod-1", undefined, 5);
  });
});
