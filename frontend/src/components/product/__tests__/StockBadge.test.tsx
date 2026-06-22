import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockBadge } from "../StockBadge";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values)
      return Object.entries(values).reduce(
        (s, [k, v]) => s.replace(`{${k}}`, String(v)),
        `product.${key}`
      );
    return `product.${key}`;
  },
}));

describe("StockBadge", () => {
  it("shows 'In Stock' for items with stock > 10", () => {
    render(<StockBadge stock={50} />);
    expect(screen.getByText("product.inStock")).toBeInTheDocument();
  });

  it("shows 'Low Stock' for items with stock <= 10", () => {
    render(<StockBadge stock={5} />);
    expect(screen.getByText(/product\.lowStock/)).toBeInTheDocument();
  });

  it("shows 'Out of Stock' for zero stock", () => {
    render(<StockBadge stock={0} />);
    expect(screen.getByText("product.outOfStock")).toBeInTheDocument();
  });

  it("accounts for reserved stock", () => {
    render(<StockBadge stock={10} reserved={10} />);
    expect(screen.getByText("product.outOfStock")).toBeInTheDocument();
  });

  it("shows remaining count for low stock", () => {
    render(<StockBadge stock={7} reserved={0} />);
    expect(screen.getByText(/product\.remaining/)).toBeInTheDocument();
  });
});
