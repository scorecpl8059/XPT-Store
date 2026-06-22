import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewForm } from "../ReviewForm";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

const mockPost = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { post: (...args: any[]) => mockPost(...args) },
}));

describe("ReviewForm", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("shows login message when not logged in", () => {
    render(
      <ReviewForm
        productId="p1"
        isLoggedIn={false}
        onSubmitted={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText("product.reviewLoginRequired")).toBeInTheDocument();
  });

  it("renders form when logged in", () => {
    render(
      <ReviewForm
        productId="p1"
        isLoggedIn={true}
        onSubmitted={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText("product.writeReview")).toBeInTheDocument();
    expect(screen.getByText("product.submitReview")).toBeInTheDocument();
  });

  it("renders 5 star buttons for rating", () => {
    const { container } = render(
      <ReviewForm
        productId="p1"
        isLoggedIn={true}
        onSubmitted={() => {}}
        onCancel={() => {}}
      />
    );
    // 5 star rating buttons
    const starButtons = container.querySelectorAll("button[type='button']");
    // 5 stars + cancel button = 6
    expect(starButtons.length).toBe(6);
  });

  it("submits review and calls onSubmitted", async () => {
    const user = userEvent.setup();
    const onSubmitted = vi.fn();
    mockPost.mockResolvedValue({ review: {} });

    render(
      <ReviewForm
        productId="p1"
        isLoggedIn={true}
        onSubmitted={onSubmitted}
        onCancel={() => {}}
      />
    );

    // Click 4th star
    const starButtons = screen.getAllByRole("button");
    await user.click(starButtons[3]); // 4th star (index 3)

    // Fill in title and comment
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Great product");
    await user.type(inputs[1], "Really loved this component");

    // Submit
    await user.click(screen.getByText("product.submitReview"));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/products/p1/reviews", {
        rating: 4,
        title: "Great product",
        comment: "Really loved this component",
      });
      expect(onSubmitted).toHaveBeenCalled();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ReviewForm
        productId="p1"
        isLoggedIn={true}
        onSubmitted={() => {}}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByText("common.cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows error when API fails", async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue(new Error("Server error"));

    render(
      <ReviewForm
        productId="p1"
        isLoggedIn={true}
        onSubmitted={() => {}}
        onCancel={() => {}}
      />
    );

    // Select rating
    const starButtons = screen.getAllByRole("button");
    await user.click(starButtons[4]); // 5th star

    // Fill form
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Title");
    await user.type(inputs[1], "Comment");

    // Submit
    await user.click(screen.getByText("product.submitReview"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});
