import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock DB module
vi.mock("../../../lib/db/wishlists", () => ({
  getWishlist: vi.fn(),
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
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

import { handler as getWishlistHandler } from "../get-wishlist";
import { handler as addWishlistHandler } from "../add-wishlist";
import { handler as removeWishlistHandler } from "../remove-wishlist";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../../../lib/db/wishlists";
import { requireAuth, AuthError } from "../../../lib/auth/middleware";

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/users/me/wishlist",
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

// ---------- GET WISHLIST ----------

describe("Get Wishlist Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns wishlist items for authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getWishlist).mockResolvedValue([
      { productId: "p1", addedAt: "2026-01-01" },
      { productId: "p2", addedAt: "2026-01-02" },
    ] as any);

    const result = await getWishlistHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].productId).toBe("p1");
    expect(getWishlist).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await getWishlistHandler(makeEvent());

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getWishlist).mockRejectedValue(new Error("DB failure"));

    const result = await getWishlistHandler(makeEvent());

    expect(result.statusCode).toBe(500);
  });
});

// ---------- ADD TO WISHLIST ----------

describe("Add Wishlist Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a product and returns 201", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(addToWishlist).mockResolvedValue(undefined as any);

    const result = await addWishlistHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ productId: "p1" }),
      })
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(201);
    expect(body.productId).toBe("p1");
    expect(addToWishlist).toHaveBeenCalledWith("user-1", "p1");
  });

  it("returns 400 when productId is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await addWishlistHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({}),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("productId is required");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await addWishlistHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ productId: "p1" }),
      })
    );

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(addToWishlist).mockRejectedValue(new Error("DB failure"));

    const result = await addWishlistHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ productId: "p1" }),
      })
    );

    expect(result.statusCode).toBe(500);
  });
});

// ---------- REMOVE FROM WISHLIST ----------

describe("Remove Wishlist Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes a product and returns 204", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(removeFromWishlist).mockResolvedValue(undefined as any);

    const result = await removeWishlistHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { productId: "p1" },
      })
    );

    expect(result.statusCode).toBe(204);
    expect(result.body).toBe("");
    expect(removeFromWishlist).toHaveBeenCalledWith("user-1", "p1");
  });

  it("returns 400 when productId path parameter is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await removeWishlistHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: null,
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Product ID is required");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await removeWishlistHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { productId: "p1" },
      })
    );

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(removeFromWishlist).mockRejectedValue(new Error("DB failure"));

    const result = await removeWishlistHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { productId: "p1" },
      })
    );

    expect(result.statusCode).toBe(500);
  });
});
