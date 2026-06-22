import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WishlistPage from "../page";
import { api } from "@/lib/api";

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/components/ui/cyber-card", () => ({
  WsCard: ({ children }: any) => <div data-testid="ws-card">{children}</div>,
  WsCardContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/cyber-button", () => ({
  WsButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/product/ProductCard", () => ({
  ProductCard: ({ product }: any) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

const mockProduct1 = {
  productId: "p1",
  name: "Arduino Uno R4",
  slug: "arduino-uno-r4",
  description: "Microcontroller board",
  categoryId: "cat-1",
  basePrice: 27.99,
  weight: 0.1,
  images: ["/img1.jpg"],
  status: "active",
  hasVariants: false,
  relatedProductIds: [],
};

const mockProduct2 = {
  productId: "p2",
  name: "ESP32 DevKit",
  slug: "esp32-devkit",
  description: "WiFi + BT module",
  categoryId: "cat-1",
  basePrice: 12.99,
  weight: 0.05,
  images: ["/img2.jpg"],
  status: "active",
  hasVariants: false,
  relatedProductIds: [],
};

describe("WishlistPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(<WishlistPage />);
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("renders page title after loading", async () => {
    mockApi.get.mockResolvedValue({ items: [] });
    render(<WishlistPage />);
    await waitFor(() => {
      expect(screen.getByText("wishlist")).toBeInTheDocument();
    });
  });

  it("shows empty state when wishlist is empty", async () => {
    mockApi.get.mockResolvedValue({ items: [] });
    render(<WishlistPage />);
    await waitFor(() => {
      expect(screen.getByText("noWishlist")).toBeInTheDocument();
    });
  });

  it("renders product cards for wishlist items", async () => {
    mockApi.get
      .mockResolvedValueOnce({ items: [{ productId: "p1" }, { productId: "p2" }] })
      .mockResolvedValueOnce(mockProduct1)
      .mockResolvedValueOnce(mockProduct2);

    render(<WishlistPage />);
    await waitFor(() => {
      expect(screen.getByText("Arduino Uno R4")).toBeInTheDocument();
      expect(screen.getByText("ESP32 DevKit")).toBeInTheDocument();
    });
  });

  it("renders correct number of product cards", async () => {
    mockApi.get
      .mockResolvedValueOnce({ items: [{ productId: "p1" }, { productId: "p2" }] })
      .mockResolvedValueOnce(mockProduct1)
      .mockResolvedValueOnce(mockProduct2);

    render(<WishlistPage />);
    await waitFor(() => {
      const cards = screen.getAllByTestId("product-card");
      expect(cards).toHaveLength(2);
    });
  });

  it("calls delete API when remove button is clicked", async () => {
    mockApi.get
      .mockResolvedValueOnce({ items: [{ productId: "p1" }] })
      .mockResolvedValueOnce(mockProduct1);
    mockApi.delete.mockResolvedValue({});

    const user = userEvent.setup();
    render(<WishlistPage />);

    await waitFor(() => {
      expect(screen.getByText("Arduino Uno R4")).toBeInTheDocument();
    });

    // The remove button is a WsButton rendered per product
    const removeButtons = screen.getAllByRole("button");
    // Click the remove button (there's one per product)
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith("/users/me/wishlist/p1");
    });
  });

  it("removes product from list after successful delete", async () => {
    mockApi.get
      .mockResolvedValueOnce({ items: [{ productId: "p1" }] })
      .mockResolvedValueOnce(mockProduct1);
    mockApi.delete.mockResolvedValue({});

    const user = userEvent.setup();
    render(<WishlistPage />);

    await waitFor(() => {
      expect(screen.getByText("Arduino Uno R4")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole("button");
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Arduino Uno R4")).not.toBeInTheDocument();
      expect(screen.getByText("noWishlist")).toBeInTheDocument();
    });
  });

  it("handles API error on fetch gracefully", async () => {
    mockApi.get.mockRejectedValue(new Error("Network error"));
    render(<WishlistPage />);
    await waitFor(() => {
      expect(screen.getByText("noWishlist")).toBeInTheDocument();
    });
  });

  it("handles partial product fetch failures", async () => {
    mockApi.get
      .mockResolvedValueOnce({ items: [{ productId: "p1" }, { productId: "p2" }] })
      .mockResolvedValueOnce(mockProduct1)
      .mockRejectedValueOnce(new Error("Product not found"));

    render(<WishlistPage />);
    await waitFor(() => {
      expect(screen.getByText("Arduino Uno R4")).toBeInTheDocument();
      // p2 failed, so only 1 card
      const cards = screen.getAllByTestId("product-card");
      expect(cards).toHaveLength(1);
    });
  });

  it("calls correct API endpoint for wishlist", async () => {
    mockApi.get.mockResolvedValue({ items: [] });
    render(<WishlistPage />);
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/users/me/wishlist");
    });
  });
});
