import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock DB module
vi.mock("../../../lib/db/cart", () => ({
  getCart: vi.fn(),
  saveCart: vi.fn(),
  clearCart: vi.fn(),
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

import { handler as getHandler } from "../get";
import { handler as upsertHandler } from "../upsert";
import { handler as addItemHandler } from "../add-item";
import { handler as removeItemHandler } from "../remove-item";
import { handler as clearHandler } from "../clear";
import { getCart, saveCart, clearCart } from "../../../lib/db/cart";
import { requireAuth, AuthError } from "../../../lib/auth/middleware";

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/cart",
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

// ---------- GET CART ----------

describe("Get Cart Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing cart for authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getCart).mockResolvedValue({
      userId: "user-1",
      items: [
        { productId: "p1", quantity: 2, addedAt: "2026-01-01T00:00:00.000Z" },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as any);

    const result = await getHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.cart.items).toHaveLength(1);
    expect(body.cart.items[0].productId).toBe("p1");
  });

  it("returns empty cart when none exists", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getCart).mockResolvedValue(null as any);

    const result = await getHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.cart.userId).toBe("user-1");
    expect(body.cart.items).toHaveLength(0);
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await getHandler(makeEvent());

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getCart).mockRejectedValue(new Error("DB failure"));

    const result = await getHandler(makeEvent());

    expect(result.statusCode).toBe(500);
  });
});

// ---------- UPSERT CART ----------

describe("Upsert Cart Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a cart with items for authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    const items = [{ productId: "p1", quantity: 3, addedAt: "2026-01-01" }];
    vi.mocked(saveCart).mockResolvedValue({
      userId: "user-1",
      items,
      updatedAt: "2026-01-01",
    } as any);

    const result = await upsertHandler(
      makeEvent({
        httpMethod: "PUT",
        body: JSON.stringify({ items }),
      })
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.cart.items).toHaveLength(1);
    expect(saveCart).toHaveBeenCalledWith({
      userId: "user-1",
      items,
      updatedAt: "",
    });
  });

  it("returns 400 when items is not an array", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await upsertHandler(
      makeEvent({
        httpMethod: "PUT",
        body: JSON.stringify({ items: "not-array" }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("items array is required");
  });

  it("returns 400 when items is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await upsertHandler(
      makeEvent({ httpMethod: "PUT", body: JSON.stringify({}) })
    );

    expect(result.statusCode).toBe(400);
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await upsertHandler(
      makeEvent({
        httpMethod: "PUT",
        body: JSON.stringify({ items: [] }),
      })
    );

    expect(result.statusCode).toBe(401);
  });
});

// ---------- ADD ITEM ----------

describe("Add Item Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a new item to an empty cart", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getCart).mockResolvedValue(null as any);
    vi.mocked(saveCart).mockResolvedValue({ userId: "user-1", items: [{ productId: "p1", quantity: 2 }] } as any);

    const result = await addItemHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ productId: "p1", quantity: 2 }),
      })
    );

    expect(result.statusCode).toBe(200);
    expect(saveCart).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        items: expect.arrayContaining([
          expect.objectContaining({ productId: "p1", quantity: 2 }),
        ]),
      })
    );
  });

  it("increments quantity for an existing item", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getCart).mockResolvedValue({
      userId: "user-1",
      items: [
        { productId: "p1", variantId: undefined, quantity: 1, addedAt: "2026-01-01" },
      ],
      updatedAt: "",
    } as any);
    vi.mocked(saveCart).mockResolvedValue({} as any);

    await addItemHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ productId: "p1", quantity: 3 }),
      })
    );

    expect(saveCart).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ productId: "p1", quantity: 4 }),
        ]),
      })
    );
  });

  it("returns 400 when productId is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await addItemHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ quantity: 2 }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe(
      "productId and a positive quantity are required"
    );
  });

  it("returns 400 when quantity is zero", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await addItemHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ productId: "p1", quantity: 0 }),
      })
    );

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when quantity is not a number", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await addItemHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ productId: "p1", quantity: "two" }),
      })
    );

    expect(result.statusCode).toBe(400);
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await addItemHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ productId: "p1", quantity: 1 }),
      })
    );

    expect(result.statusCode).toBe(401);
  });
});

// ---------- REMOVE ITEM ----------

describe("Remove Item Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes an item from the cart", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getCart).mockResolvedValue({
      userId: "user-1",
      items: [
        { productId: "p1", variantId: undefined, quantity: 2, addedAt: "2026-01-01" },
        { productId: "p2", variantId: undefined, quantity: 1, addedAt: "2026-01-01" },
      ],
      updatedAt: "",
    } as any);
    vi.mocked(saveCart).mockResolvedValue({} as any);

    const result = await removeItemHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { productId: "p1" },
      })
    );

    expect(result.statusCode).toBe(200);
    expect(saveCart).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({ productId: "p2" }),
        ],
      })
    );
  });

  it("filters by variantId when provided", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getCart).mockResolvedValue({
      userId: "user-1",
      items: [
        { productId: "p1", variantId: "v1", quantity: 1, addedAt: "2026-01-01" },
        { productId: "p1", variantId: "v2", quantity: 1, addedAt: "2026-01-01" },
      ],
      updatedAt: "",
    } as any);
    vi.mocked(saveCart).mockResolvedValue({} as any);

    await removeItemHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { productId: "p1" },
        queryStringParameters: { variantId: "v1" },
      })
    );

    expect(saveCart).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [expect.objectContaining({ productId: "p1", variantId: "v2" })],
      })
    );
  });

  it("returns 400 when productId path parameter is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await removeItemHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: null,
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe(
      "productId path parameter is required"
    );
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await removeItemHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { productId: "p1" },
      })
    );

    expect(result.statusCode).toBe(401);
  });
});

// ---------- CLEAR CART ----------

describe("Clear Cart Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the cart and returns 204", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(clearCart).mockResolvedValue(undefined as any);

    const result = await clearHandler(
      makeEvent({ httpMethod: "DELETE" })
    );

    expect(result.statusCode).toBe(204);
    expect(result.body).toBe("");
    expect(clearCart).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await clearHandler(
      makeEvent({ httpMethod: "DELETE" })
    );

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(clearCart).mockRejectedValue(new Error("DB failure"));

    const result = await clearHandler(
      makeEvent({ httpMethod: "DELETE" })
    );

    expect(result.statusCode).toBe(500);
  });
});
