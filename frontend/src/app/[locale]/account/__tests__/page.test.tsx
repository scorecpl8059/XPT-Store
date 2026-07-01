import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AccountDashboardPage from "../page";
import { api } from "@/lib/api";

const mockApi = api as { get: ReturnType<typeof vi.fn> };

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: any) => {
    if (params?.name) return `${key} ${params.name}`;
    return key;
  },
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

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { name: "Test User", email: "test@test.com" },
  }),
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

vi.mock("@/components/ui/cyber-button", () => ({
  WsButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

const mockOrder = {
  orderId: "ord-1",
  orderNumber: "XPT-20260620-0001",
  status: "processing",
  total: 59.99,
  createdAt: "2026-06-20T00:00:00Z",
  items: [{ productId: "p1", name: "Arduino", sku: "ARD-001", price: 29.99, quantity: 2 }],
};

const mockAddress = {
  addressId: "addr-1",
  userId: "u1",
  recipientName: "Test User",
  phone: "555-1234",
  street1: "123 Main St",
  city: "Portland",
  state: "OR",
  zipCode: "97201",
  country: "US",
  isDefault: true,
};

describe("AccountDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockApi.get.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AccountDashboardPage />);
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("renders welcome message with user name after data loads", async () => {
    mockApi.get.mockResolvedValue({ orders: [], addresses: [], items: [] });
    render(<AccountDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("welcome Test User")).toBeInTheDocument();
    });
  });

  it("renders stats cards with correct counts", async () => {
    mockApi.get
      .mockResolvedValueOnce({ orders: [mockOrder, { ...mockOrder, orderId: "ord-2" }] })
      .mockResolvedValueOnce({ addresses: [mockAddress] })
      .mockResolvedValueOnce({ items: [{ productId: "p1" }, { productId: "p2" }, { productId: "p3" }] });

    render(<AccountDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // orders
      expect(screen.getByText("1")).toBeInTheDocument(); // addresses
      expect(screen.getByText("3")).toBeInTheDocument(); // wishlist
    });
  });

  it("shows recent orders with order number and status", async () => {
    mockApi.get
      .mockResolvedValueOnce({ orders: [mockOrder] })
      .mockResolvedValueOnce({ addresses: [] })
      .mockResolvedValueOnce({ items: [] });

    render(<AccountDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/XPT-20260620-0001/)).toBeInTheDocument();
      expect(screen.getByText("processing")).toBeInTheDocument();
      expect(screen.getByText("$59.99")).toBeInTheDocument();
    });
  });

  it("shows no orders message when orders are empty", async () => {
    mockApi.get.mockResolvedValue({ orders: [], addresses: [], items: [] });
    render(<AccountDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("noOrders")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockApi.get.mockRejectedValue(new Error("Network error"));
    render(<AccountDashboardPage />);
    await waitFor(() => {
      // Should still render after error, with zero counts
      expect(screen.getByText("welcome Test User")).toBeInTheDocument();
      expect(screen.getByText("noOrders")).toBeInTheDocument();
    });
  });

  it("renders view all orders link", async () => {
    mockApi.get.mockResolvedValue({ orders: [], addresses: [], items: [] });
    render(<AccountDashboardPage />);
    await waitFor(() => {
      expect(screen.getAllByText("recentOrders").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders order links that navigate to order detail", async () => {
    mockApi.get
      .mockResolvedValueOnce({ orders: [mockOrder] })
      .mockResolvedValueOnce({ addresses: [] })
      .mockResolvedValueOnce({ items: [] });

    render(<AccountDashboardPage />);
    await waitFor(() => {
      const orderLink = screen.getByText(/XPT-20260620-0001/).closest("a");
      expect(orderLink).toHaveAttribute("href", "/account/orders/ord-1");
    });
  });
});
