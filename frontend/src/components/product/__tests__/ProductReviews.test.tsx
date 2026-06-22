import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductReviews } from "../ProductReviews";
import type { Review } from "@/types/review";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, unknown>) => {
    if (values)
      return Object.entries(values).reduce(
        (s, [k, v]) => s.replace(`{${k}}`, String(v)),
        `${ns}.${key}`
      );
    return `${ns}.${key}`;
  },
}));

const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}));

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    productId: "prod-1",
    reviewId: "r1",
    userId: "u1",
    userName: "John",
    rating: 4,
    title: "Good product",
    comment: "Really solid component",
    status: "approved",
    createdAt: "2026-06-15T12:00:00.000Z",
    updatedAt: "2026-06-15T12:00:00.000Z",
    ...overrides,
  };
}

describe("ProductReviews", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders reviews heading with count", () => {
    mockGet.mockResolvedValue({ items: [] });
    render(
      <ProductReviews
        productId="prod-1"
        averageRating={4.5}
        reviewCount={10}
        onWriteReview={() => {}}
      />
    );
    expect(screen.getByText(/product\.reviews.*10/)).toBeInTheDocument();
  });

  it("renders write review button", () => {
    mockGet.mockResolvedValue({ items: [] });
    render(
      <ProductReviews
        productId="prod-1"
        averageRating={0}
        reviewCount={0}
        onWriteReview={() => {}}
      />
    );
    expect(screen.getByText("product.writeReview")).toBeInTheDocument();
  });

  it("calls onWriteReview when button clicked", async () => {
    const user = userEvent.setup();
    const onWrite = vi.fn();
    mockGet.mockResolvedValue({ items: [] });

    render(
      <ProductReviews
        productId="prod-1"
        averageRating={0}
        reviewCount={0}
        onWriteReview={onWrite}
      />
    );

    await user.click(screen.getByText("product.writeReview"));
    expect(onWrite).toHaveBeenCalled();
  });

  it("shows no reviews message when empty", async () => {
    mockGet.mockResolvedValue({ items: [] });
    render(
      <ProductReviews
        productId="prod-1"
        averageRating={0}
        reviewCount={0}
        onWriteReview={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("product.noReviews")).toBeInTheDocument();
    });
  });

  it("renders individual reviews", async () => {
    const reviews = [
      makeReview({ reviewId: "r1", title: "Great!", userName: "Alice" }),
      makeReview({ reviewId: "r2", title: "Decent", userName: "Bob" }),
    ];
    mockGet.mockResolvedValue({ items: reviews });

    render(
      <ProductReviews
        productId="prod-1"
        averageRating={4}
        reviewCount={2}
        onWriteReview={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Great!")).toBeInTheDocument();
      expect(screen.getByText("Decent")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("renders rating summary when reviews exist", async () => {
    mockGet.mockResolvedValue({ items: [makeReview()] });

    render(
      <ProductReviews
        productId="prod-1"
        averageRating={4.5}
        reviewCount={10}
        onWriteReview={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });
  });

  it("shows loading skeletons while fetching", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <ProductReviews
        productId="prod-1"
        averageRating={0}
        reviewCount={0}
        onWriteReview={() => {}}
      />
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
