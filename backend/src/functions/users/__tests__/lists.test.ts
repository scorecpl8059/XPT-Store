import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock DB modules
vi.mock("../../../lib/db/orders", () => ({
  listOrdersByUser: vi.fn(),
}));

vi.mock("../../../lib/db/reviews", () => ({
  getReviewsByUser: vi.fn(),
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

import { handler as listOrdersHandler } from "../list-orders";
import { handler as listReviewsHandler } from "../list-reviews";
import { listOrdersByUser } from "../../../lib/db/orders";
import { getReviewsByUser } from "../../../lib/db/reviews";
import { requireAuth, AuthError } from "../../../lib/auth/middleware";

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/users/me/orders",
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

// ---------- LIST ORDERS ----------

describe("List Orders Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns orders for authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(listOrdersByUser).mockResolvedValue([
      { orderId: "o1", status: "delivered", total: 100 },
      { orderId: "o2", status: "processing", total: 50 },
    ] as any);

    const result = await listOrdersHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].orderId).toBe("o1");
    expect(listOrdersByUser).toHaveBeenCalledWith("user-1", {
      limit: undefined,
    });
  });

  it("passes limit query parameter to DB", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(listOrdersByUser).mockResolvedValue([] as any);

    await listOrdersHandler(
      makeEvent({
        queryStringParameters: { limit: "5" },
      })
    );

    expect(listOrdersByUser).toHaveBeenCalledWith("user-1", { limit: 5 });
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await listOrdersHandler(makeEvent());

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(listOrdersByUser).mockRejectedValue(new Error("DB failure"));

    const result = await listOrdersHandler(makeEvent());

    expect(result.statusCode).toBe(500);
  });
});

// ---------- LIST REVIEWS ----------

describe("List Reviews Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns reviews for authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getReviewsByUser).mockResolvedValue([
      { reviewId: "r1", productId: "p1", rating: 5, comment: "Great" },
    ] as any);

    const result = await listReviewsHandler(makeEvent({ path: "/users/me/reviews" }));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].reviewId).toBe("r1");
    expect(getReviewsByUser).toHaveBeenCalledWith("user-1", {
      limit: undefined,
    });
  });

  it("passes limit query parameter to DB", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getReviewsByUser).mockResolvedValue([] as any);

    await listReviewsHandler(
      makeEvent({
        queryStringParameters: { limit: "10" },
      })
    );

    expect(getReviewsByUser).toHaveBeenCalledWith("user-1", { limit: 10 });
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await listReviewsHandler(makeEvent());

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getReviewsByUser).mockRejectedValue(new Error("DB failure"));

    const result = await listReviewsHandler(makeEvent());

    expect(result.statusCode).toBe(500);
  });
});
