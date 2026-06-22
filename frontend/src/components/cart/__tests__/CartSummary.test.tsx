import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartSummary } from "../CartSummary";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `cart.${key}`,
}));

describe("CartSummary", () => {
  it("renders subtotal", () => {
    render(<CartSummary subtotal={49.99} />);
    expect(screen.getByText("cart.subtotal")).toBeInTheDocument();
    expect(screen.getAllByText("$49.99").length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'calculated at checkout' when shipping is not provided", () => {
    render(<CartSummary subtotal={49.99} />);
    expect(screen.getByText("cart.calculatedAtCheckout")).toBeInTheDocument();
  });

  it("displays shipping cost when provided", () => {
    render(<CartSummary subtotal={49.99} shippingCost={5.0} />);
    expect(screen.getByText("$5.00")).toBeInTheDocument();
  });

  it("displays tax when provided", () => {
    render(<CartSummary subtotal={49.99} tax={4.5} />);
    expect(screen.getByText("cart.tax")).toBeInTheDocument();
    expect(screen.getByText("$4.50")).toBeInTheDocument();
  });

  it("does not display tax row when tax is not provided", () => {
    render(<CartSummary subtotal={49.99} />);
    expect(screen.queryByText("cart.tax")).not.toBeInTheDocument();
  });

  it("computes total from subtotal + shipping + tax when total is not provided", () => {
    render(<CartSummary subtotal={50.0} shippingCost={5.0} tax={4.0} />);
    expect(screen.getByText("cart.total")).toBeInTheDocument();
    expect(screen.getByText("$59.00")).toBeInTheDocument();
  });

  it("uses explicit total when provided", () => {
    render(
      <CartSummary subtotal={50.0} shippingCost={5.0} tax={4.0} total={100.0} />
    );
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("computes total as just subtotal when no shipping or tax", () => {
    render(<CartSummary subtotal={25.5} />);
    // $25.50 appears in both subtotal and total rows
    expect(screen.getAllByText("$25.50")).toHaveLength(2);
  });

  it("applies compact spacing class when compact is true", () => {
    const { container } = render(<CartSummary subtotal={10} compact />);
    expect(container.firstChild).toHaveClass("space-y-1.5");
  });

  it("applies normal spacing class when compact is false", () => {
    const { container } = render(<CartSummary subtotal={10} />);
    expect(container.firstChild).toHaveClass("space-y-2");
  });
});
