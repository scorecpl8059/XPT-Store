import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderReview } from "../OrderReview";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/cart/CartSummary", () => ({
  CartSummary: ({ subtotal, shippingCost, tax, total }: any) => (
    <div data-testid="cart-summary">
      <span data-testid="summary-subtotal">${subtotal.toFixed(2)}</span>
      <span data-testid="summary-total">${total.toFixed(2)}</span>
    </div>
  ),
}));

const mockItems = [
  {
    productId: "prod-1",
    variantId: undefined,
    quantity: 2,
    addedAt: "2026-01-01T00:00:00Z",
  },
  {
    productId: "prod-2",
    variantId: "var-a",
    quantity: 1,
    addedAt: "2026-01-02T00:00:00Z",
  },
];

const mockProductInfoMap = {
  "prod-1": { name: "Arduino Uno", price: 25.99 },
  "prod-2": { name: "Raspberry Pi", price: 45.0, image: "/rpi.jpg" },
};

const mockShippingAddress = {
  recipientName: "John Doe",
  street1: "123 Main St",
  city: "Springfield",
  state: "IL",
  zipCode: "62701",
};

const defaultProps = {
  items: mockItems,
  productInfoMap: mockProductInfoMap,
  subtotal: 96.98,
  shippingCost: 5.0,
  tax: 8.73,
  total: 110.71,
  shippingAddress: mockShippingAddress,
};

describe("OrderReview", () => {
  it("renders the review order heading", () => {
    render(<OrderReview {...defaultProps} />);
    expect(screen.getByText("reviewOrder")).toBeInTheDocument();
  });

  it("renders the items heading", () => {
    render(<OrderReview {...defaultProps} />);
    expect(screen.getByText("items")).toBeInTheDocument();
  });

  it("displays each item with name and quantity", () => {
    render(<OrderReview {...defaultProps} />);
    expect(screen.getByText(/Arduino Uno/)).toBeInTheDocument();
    expect(screen.getByText(/Raspberry Pi/)).toBeInTheDocument();
  });

  it("displays item line totals", () => {
    render(<OrderReview {...defaultProps} />);
    // Arduino Uno: 25.99 * 2 = 51.98
    expect(screen.getByText("$51.98")).toBeInTheDocument();
    // Raspberry Pi: 45.00 * 1 = 45.00
    expect(screen.getByText("$45.00")).toBeInTheDocument();
  });

  it("displays the shipping address", () => {
    render(<OrderReview {...defaultProps} />);
    expect(screen.getByText("shippingAddress")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(
      screen.getByText(/123 Main St.*Springfield.*IL.*62701/)
    ).toBeInTheDocument();
  });

  it("displays PO number when provided", () => {
    render(<OrderReview {...defaultProps} poNumber="PO-12345" />);
    expect(screen.getByText("poNumber")).toBeInTheDocument();
    expect(screen.getByText("PO-12345")).toBeInTheDocument();
  });

  it("does not display PO number when not provided", () => {
    render(<OrderReview {...defaultProps} />);
    expect(screen.queryByText("poNumber")).not.toBeInTheDocument();
  });

  it("displays order notes when provided", () => {
    render(<OrderReview {...defaultProps} notes="Please ship ASAP" />);
    expect(screen.getByText("orderNotes")).toBeInTheDocument();
    expect(screen.getByText("Please ship ASAP")).toBeInTheDocument();
  });

  it("does not display order notes when not provided", () => {
    render(<OrderReview {...defaultProps} />);
    expect(screen.queryByText("orderNotes")).not.toBeInTheDocument();
  });

  it("renders the cart summary component", () => {
    render(<OrderReview {...defaultProps} />);
    expect(screen.getByTestId("cart-summary")).toBeInTheDocument();
    expect(screen.getByTestId("summary-total")).toHaveTextContent("$110.71");
  });

  it("falls back to productId when product info is missing", () => {
    const items = [
      {
        productId: "unknown-prod",
        quantity: 1,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ];
    render(
      <OrderReview
        {...defaultProps}
        items={items}
        productInfoMap={{}}
      />
    );
    expect(screen.getByText(/unknown-prod/)).toBeInTheDocument();
  });
});
