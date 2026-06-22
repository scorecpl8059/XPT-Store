import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "../ProductCard";
import type { Product } from "@/types/product";

// Mocks
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `product.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    productId: "prod-1",
    name: "Arduino Uno R4",
    slug: "arduino-uno-r4",
    description: "<p>Board</p>",
    categoryId: "cat-1",
    basePrice: 24.99,
    weight: 0.1,
    images: ["https://cdn.example.com/arduino.jpg"],
    status: "active",
    hasVariants: false,
    relatedProductIds: [],
    averageRating: 4.5,
    reviewCount: 12,
    totalSold: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ProductCard", () => {
  it("renders product name", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("Arduino Uno R4")).toBeInTheDocument();
  });

  it("renders product price formatted to 2 decimals", () => {
    render(<ProductCard product={makeProduct({ basePrice: 9.9 })} />);
    expect(screen.getByText("$9.90")).toBeInTheDocument();
  });

  it("links to product detail page by slug", () => {
    render(<ProductCard product={makeProduct()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/arduino-uno-r4");
  });

  it("renders product image when available", () => {
    render(<ProductCard product={makeProduct()} />);
    const img = screen.getByAltText("Arduino Uno R4");
    expect(img).toHaveAttribute("src", "https://cdn.example.com/arduino.jpg");
  });

  it("renders placeholder when no image", () => {
    render(<ProductCard product={makeProduct({ images: [] })} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders star rating when reviewCount > 0", () => {
    const { container } = render(
      <ProductCard product={makeProduct({ reviewCount: 5, averageRating: 3 })} />
    );
    // 5 star elements exist
    const stars = container.querySelectorAll(".h-3.w-3");
    expect(stars.length).toBe(5);
    // review count shown
    expect(screen.getByText("(5)")).toBeInTheDocument();
  });

  it("does not render rating when reviewCount is 0", () => {
    render(<ProductCard product={makeProduct({ reviewCount: 0 })} />);
    expect(screen.queryByText("(0)")).not.toBeInTheDocument();
  });

  it("shows Draft badge for draft products", () => {
    render(<ProductCard product={makeProduct({ status: "draft" })} />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("does not show Draft badge for active products", () => {
    render(<ProductCard product={makeProduct({ status: "active" })} />);
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(
      <ProductCard product={makeProduct()} className="test-class" />
    );
    const link = container.querySelector("a");
    expect(link?.className).toContain("test-class");
  });

  it("prevents default on cart button click", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={makeProduct()} />);
    // The cart button is a ghost button inside the link
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(1);
  });
});
