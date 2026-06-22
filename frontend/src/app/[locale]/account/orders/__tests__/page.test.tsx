import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OrdersPage from "../page";
import { api } from "@/lib/api";

const mockApi = api as { get: ReturnType<typeof vi.fn> };

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: any) => (
    <a href={typeof href === "string" ? href : "/"}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("@/components/ui/cyber-card", () => ({
  WsCard: ({ children }: any) => <div data-testid="ws-card">{children}</div>,
  WsCardContent: ({ children }: any) => <div>{children}</div>,
  WsCardHeader: ({ children }: any) => <div>{children}</div>,
  WsCardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock("@/components/ui/cyber-badge", () => ({
  WsBadge: ({ children }: any) => <span data-testid="ws-badge">{children}</span>,
}));

const mockOrder = {
  orderId: "ord-1",
  orderNumber: "XPT-20260620-0001",
  status: "processing",
  total: 129.5,
  createdAt: "2026-06-20T00:00:00Z",
  items: [
    { productId: "p1", name: "ESP32", sku: "ESP-001", price: 12.99, quantity: 5 },
    { productId: "p2", name: "Resistor Pack", sku: "RES-100", price: 64.55, quantity: 1 },
  ],
};

const mockOrder2 = {
  orderId: "ord-2",
  orderNumber: "XPT-20260619-0002",
  status: "delivered",
  total: 45.0,
  createdAt: "2026-06-19T00:00:00Z",
  items: [{ productId: "p3", name: "LED Strip", sku: "LED-010", price: 45.0, quantity: 1 }],
};

describe("OrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(<OrdersPage />);
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("renders page title after loading", async () => {
    mockApi.get.mockResolvedValue({ orders: [] });
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText("orders")).toBeInTheDocument();
    });
  });

  it("shows empty state when no orders exist", async () => {
    mockApi.get.mockResolvedValue({ orders: [] });
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText("noOrders")).toBeInTheDocument();
    });
  });

  it("renders order cards with order details", async () => {
    mockApi.get.mockResolvedValue({ orders: [mockOrder, mockOrder2] });
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText(/XPT-20260620-0001/)).toBeInTheDocument();
      expect(screen.getByText(/XPT-20260619-0002/)).toBeInTheDocument();
    });
  });

  it("displays order total formatted with two decimals", async () => {
    mockApi.get.mockResolvedValue({ orders: [mockOrder] });
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText("$129.50")).toBeInTheDocument();
    });
  });

  it("displays order status as a badge", async () => {
    mockApi.get.mockResolvedValue({ orders: [mockOrder] });
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText("processing")).toBeInTheDocument();
      const badges = screen.getAllByTestId("ws-badge");
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("displays item count for each order", async () => {
    mockApi.get.mockResolvedValue({ orders: [mockOrder] });
    render(<OrdersPage />);
    await waitFor(() => {
      // mockOrder has 2 items, rendered as "items: 2"
      expect(screen.getByText(/items.*2/)).toBeInTheDocument();
    });
  });

  it("renders order links to detail pages", async () => {
    mockApi.get.mockResolvedValue({ orders: [mockOrder] });
    render(<OrdersPage />);
    await waitFor(() => {
      const link = screen.getByText(/XPT-20260620-0001/).closest("a");
      expect(link).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockApi.get.mockRejectedValue(new Error("Server error"));
    render(<OrdersPage />);
    await waitFor(() => {
      // Should show empty state on error
      expect(screen.getByText("noOrders")).toBeInTheDocument();
    });
  });

  it("calls the correct API endpoint", async () => {
    mockApi.get.mockResolvedValue({ orders: [] });
    render(<OrdersPage />);
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/users/me/orders");
    });
  });
});
