import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartDrawer } from "../CartDrawer";

// Mocks
const mockPush = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
let mockItems: any[] = [];

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `cart.${key}`,
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

// Mock Sheet to a simple div that renders children when open
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: any) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: any) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: any) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetFooter: ({ children }: any) => (
    <div data-testid="sheet-footer">{children}</div>
  ),
}));

// Mock CartItem and CartSummary to simple representations
vi.mock("../CartItem", () => ({
  CartItem: ({ productName, onRemove, onUpdateQuantity }: any) => (
    <div data-testid="cart-item">
      <span>{productName || "Unknown"}</span>
      <button data-testid="remove-btn" onClick={onRemove}>
        Remove
      </button>
      <button data-testid="update-qty-btn" onClick={() => onUpdateQuantity(3)}>
        Update
      </button>
    </div>
  ),
}));

vi.mock("../CartSummary", () => ({
  CartSummary: ({ subtotal }: any) => (
    <div data-testid="cart-summary">Subtotal: ${subtotal.toFixed(2)}</div>
  ),
}));

vi.mock("@/components/ui/cyber-button", () => ({
  WsButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe("CartDrawer", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockPush.mockReset();
    mockOnOpenChange.mockReset();
    mockUpdateQuantity.mockReset();
    mockRemoveItem.mockReset();
    mockItems = [];
  });

  it("does not render when open is false", () => {
    render(<CartDrawer open={false} onOpenChange={mockOnOpenChange} />);
    expect(screen.queryByTestId("sheet")).not.toBeInTheDocument();
  });

  it("renders the drawer title when open", () => {
    render(<CartDrawer open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText("cart.title")).toBeInTheDocument();
  });

  it("shows empty state when cart has no items", () => {
    mockItems = [];
    render(<CartDrawer open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText("cart.empty")).toBeInTheDocument();
    expect(screen.getByText("cart.continueShopping")).toBeInTheDocument();
  });

  it("navigates to products and closes drawer on continue shopping click", async () => {
    mockItems = [];
    const user = userEvent.setup();
    render(<CartDrawer open={true} onOpenChange={mockOnOpenChange} />);
    await user.click(screen.getByText("cart.continueShopping"));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalledWith("/products");
  });

  it("renders cart items when cart has items", async () => {
    mockItems = [
      { productId: "prod-1", quantity: 2, addedAt: "2026-01-01T00:00:00Z" },
    ];
    render(<CartDrawer open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByTestId("cart-item")).toBeInTheDocument();
  });

  it("renders checkout button when cart has items", () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    render(<CartDrawer open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText("cart.checkout")).toBeInTheDocument();
  });

  it("navigates to checkout and closes drawer on checkout click", async () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    const user = userEvent.setup();
    render(<CartDrawer open={true} onOpenChange={mockOnOpenChange} />);
    await user.click(screen.getByText("cart.checkout"));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalledWith("/checkout");
  });

  it("renders cart summary with subtotal", () => {
    mockItems = [
      { productId: "prod-1", quantity: 1, addedAt: "2026-01-01T00:00:00Z" },
    ];
    render(<CartDrawer open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByTestId("cart-summary")).toBeInTheDocument();
  });
});
