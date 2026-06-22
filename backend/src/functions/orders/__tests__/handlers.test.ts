import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock DB modules
vi.mock("../../../lib/db/orders", () => ({
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  listOrdersByUser: vi.fn(),
}));

vi.mock("../../../lib/db/addresses", () => ({
  getAddresses: vi.fn(),
}));

vi.mock("../../../lib/db/products", () => ({
  getProductById: vi.fn(),
}));

vi.mock("../../../lib/db/variants", () => ({
  getVariantsByProduct: vi.fn(),
}));

vi.mock("../../../lib/db/shipping", () => ({
  calculateShippingRate: vi.fn(),
}));

vi.mock("../../../lib/stripe/client", () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock auth middleware
vi.mock("../../../lib/auth/middleware", () => ({
  requireAuth: vi.fn(),
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthError";
    }
  },
}));

import { handler as createHandler } from "../create";
import { handler as getHandler } from "../get";
import { handler as listHandler } from "../list";
import {
  createOrder,
  getOrderById,
  listOrdersByUser,
} from "../../../lib/db/orders";
import { getAddresses } from "../../../lib/db/addresses";
import { getProductById } from "../../../lib/db/products";
import { getVariantsByProduct } from "../../../lib/db/variants";
import { calculateShippingRate } from "../../../lib/db/shipping";
import { stripe } from "../../../lib/stripe/client";
import { requireAuth, AuthError } from "../../../lib/auth/middleware";

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/orders",
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    body: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
    ...overrides,
  };
}

const mockUser = {
  userId: "user-1",
  email: "test@test.com",
  name: "Test User",
  role: "customer" as const,
};

const mockAdmin = {
  userId: "admin-1",
  email: "admin@test.com",
  name: "Admin",
  role: "admin" as const,
};

// ---------- CREATE ORDER ----------

describe("Create Order Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an order with inline shipping address", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getProductById).mockResolvedValue({
      productId: "p1",
      name: "Widget",
      slug: "widget",
      basePrice: 25.0,
      images: ["img1.jpg"],
      weight: 1.0,
    } as any);
    vi.mocked(calculateShippingRate).mockResolvedValue({
      rate: { price: 5.99 },
      zone: { name: "Continental US" },
    } as any);
    vi.mocked(stripe.paymentIntents.create).mockResolvedValue({
      id: "pi_123",
      client_secret: "secret_123",
    } as any);
    vi.mocked(stripe.paymentIntents.update).mockResolvedValue({} as any);
    vi.mocked(createOrder).mockResolvedValue({
      orderId: "ord-1",
      userId: "user-1",
      status: "pending",
      items: [{ productId: "p1", name: "Widget", price: 25.0, quantity: 2 }],
      subtotal: 50.0,
      shippingCost: 5.99,
      tax: 4.0,
      total: 59.99,
    } as any);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({
          items: [{ productId: "p1", quantity: 2 }],
          shippingAddress: {
            recipientName: "Test User",
            phone: "555-1234",
            street1: "123 Main St",
            city: "Austin",
            state: "TX",
            zipCode: "78701",
            country: "US",
          },
        }),
      })
    );

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.order.orderId).toBe("ord-1");
    expect(body.clientSecret).toBe("secret_123");
    expect(createOrder).toHaveBeenCalled();
  });

  it("creates an order with saved address IDs", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getAddresses).mockResolvedValue([
      {
        addressId: "addr-1",
        recipientName: "Test",
        phone: "555-0000",
        street1: "1 St",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        country: "US",
      },
    ] as any);
    vi.mocked(getProductById).mockResolvedValue({
      productId: "p1",
      name: "Widget",
      slug: "widget",
      basePrice: 10.0,
      images: ["img.jpg"],
      weight: 0.5,
    } as any);
    vi.mocked(calculateShippingRate).mockResolvedValue(null as any);
    vi.mocked(stripe.paymentIntents.create).mockResolvedValue({
      id: "pi_456",
      client_secret: "secret_456",
    } as any);
    vi.mocked(stripe.paymentIntents.update).mockResolvedValue({} as any);
    vi.mocked(createOrder).mockResolvedValue({ orderId: "ord-2" } as any);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({
          items: [{ productId: "p1", quantity: 1 }],
          shippingAddressId: "addr-1",
        }),
      })
    );

    expect(result.statusCode).toBe(201);
  });

  it("returns 400 when body is empty", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await createHandler(
      makeEvent({ httpMethod: "POST", body: null })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Request body is required");
  });

  it("returns 400 when items array is empty", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ items: [], shippingAddress: {} }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe(
      "Order must contain at least one item"
    );
  });

  it("returns 400 when shipping address is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ items: [{ productId: "p1", quantity: 1 }] }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Shipping address is required");
  });

  it("returns 404 when saved shipping address not found", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getAddresses).mockResolvedValue([]);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({
          items: [{ productId: "p1", quantity: 1 }],
          shippingAddressId: "missing-addr",
        }),
      })
    );

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Shipping address not found");
  });

  it("returns 404 when product not found", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getProductById).mockResolvedValue(null as any);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({
          items: [{ productId: "missing", quantity: 1 }],
          shippingAddress: {
            recipientName: "Test",
            phone: "555",
            street1: "1 St",
            city: "Austin",
            state: "TX",
            zipCode: "78701",
            country: "US",
          },
        }),
      })
    );

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Product not found: missing");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ items: [{ productId: "p1", quantity: 1 }] }),
      })
    );

    expect(result.statusCode).toBe(401);
  });
});

// ---------- GET ORDER ----------

describe("Get Order Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns order for the owner", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getOrderById).mockResolvedValue({
      orderId: "ord-1",
      userId: "user-1",
      status: "pending",
      total: 59.99,
    } as any);

    const result = await getHandler(
      makeEvent({ pathParameters: { id: "ord-1" } })
    );

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.orderId).toBe("ord-1");
  });

  it("returns order for an admin viewing another user's order", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockAdmin);
    vi.mocked(getOrderById).mockResolvedValue({
      orderId: "ord-1",
      userId: "user-1",
      status: "pending",
    } as any);

    const result = await getHandler(
      makeEvent({ pathParameters: { id: "ord-1" } })
    );

    expect(result.statusCode).toBe(200);
  });

  it("returns 404 when a non-owner non-admin tries to view", async () => {
    vi.mocked(requireAuth).mockReturnValue({
      ...mockUser,
      userId: "other-user",
    });
    vi.mocked(getOrderById).mockResolvedValue({
      orderId: "ord-1",
      userId: "user-1",
      status: "pending",
    } as any);

    const result = await getHandler(
      makeEvent({ pathParameters: { id: "ord-1" } })
    );

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Order not found");
  });

  it("returns 400 when order ID is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await getHandler(
      makeEvent({ pathParameters: null })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Order ID is required");
  });

  it("returns 404 when order does not exist", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getOrderById).mockResolvedValue(null as any);

    const result = await getHandler(
      makeEvent({ pathParameters: { id: "nonexistent" } })
    );

    expect(result.statusCode).toBe(404);
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await getHandler(
      makeEvent({ pathParameters: { id: "ord-1" } })
    );

    expect(result.statusCode).toBe(401);
  });
});

// ---------- LIST ORDERS ----------

describe("List Orders Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns orders for the authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(listOrdersByUser).mockResolvedValue({
      items: [
        { orderId: "ord-1", userId: "user-1", status: "pending" },
        { orderId: "ord-2", userId: "user-1", status: "processing" },
      ],
    } as any);

    const result = await listHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toHaveLength(2);
  });

  it("passes limit from query params", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(listOrdersByUser).mockResolvedValue({ items: [] } as any);

    await listHandler(
      makeEvent({ queryStringParameters: { limit: "5" } })
    );

    expect(listOrdersByUser).toHaveBeenCalledWith("user-1", { limit: 5 });
  });

  it("uses undefined limit when not provided", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(listOrdersByUser).mockResolvedValue({ items: [] } as any);

    await listHandler(makeEvent());

    expect(listOrdersByUser).toHaveBeenCalledWith("user-1", {
      limit: undefined,
    });
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await listHandler(makeEvent());

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(listOrdersByUser).mockRejectedValue(new Error("DB failure"));

    const result = await listHandler(makeEvent());

    expect(result.statusCode).toBe(500);
  });
});
