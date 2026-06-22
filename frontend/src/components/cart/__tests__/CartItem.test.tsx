import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartItem } from "../CartItem";

// Mocks
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `cart.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: any) => (
    <a href={typeof href === "string" ? href : "/"}>{children}</a>
  ),
}));

const mockItem = {
  productId: "prod-1",
  variantId: "var-1",
  quantity: 2,
  addedAt: "2026-01-01T00:00:00Z",
};

describe("CartItem", () => {
  const mockUpdateQuantity = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    mockUpdateQuantity.mockReset();
    mockRemove.mockReset();
  });

  it("renders product name and price", () => {
    render(
      <CartItem
        item={mockItem}
        productName="Arduino Uno"
        price={25.99}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    expect(screen.getByText("Arduino Uno")).toBeInTheDocument();
    expect(screen.getByText("$25.99")).toBeInTheDocument();
  });

  it("falls back to productId when no productName is provided", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    expect(screen.getByText("prod-1")).toBeInTheDocument();
  });

  it("displays variant label when provided", () => {
    render(
      <CartItem
        item={mockItem}
        productName="Arduino Uno"
        variantLabel="Blue / Large"
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    expect(screen.getByText("Blue / Large")).toBeInTheDocument();
  });

  it("displays the current quantity", () => {
    render(
      <CartItem
        item={mockItem}
        productName="Arduino Uno"
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onUpdateQuantity with decremented value when minus is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CartItem
        item={mockItem}
        productName="Arduino Uno"
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    await user.click(screen.getByLabelText("Decrease quantity"));
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1);
  });

  it("calls onUpdateQuantity with incremented value when plus is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CartItem
        item={mockItem}
        productName="Arduino Uno"
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    await user.click(screen.getByLabelText("Increase quantity"));
    expect(mockUpdateQuantity).toHaveBeenCalledWith(3);
  });

  it("calls onRemove when remove button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CartItem
        item={mockItem}
        productName="Arduino Uno"
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    await user.click(screen.getByLabelText("cart.remove"));
    expect(mockRemove).toHaveBeenCalledOnce();
  });

  it("renders product image when provided", () => {
    render(
      <CartItem
        item={mockItem}
        productName="Arduino Uno"
        productImage="/images/arduino.jpg"
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    const img = screen.getByAltText("Arduino Uno");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/arduino.jpg");
  });

  it("renders placeholder when no image is provided", () => {
    const { container } = render(
      <CartItem
        item={mockItem}
        productName="Arduino Uno"
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemove}
      />
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // The placeholder div should exist inside the link
    const links = container.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
  });
});
