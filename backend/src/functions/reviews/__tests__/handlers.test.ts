import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock DB module
vi.mock("../../../lib/db/reviews", () => ({
  getReviewsByProduct: vi.fn(),
  createReview: vi.fn(),
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

import { handler as listHandler } from "../list";
import { handler as createHandler } from "../create";
import { getReviewsByProduct, createReview } from "../../../lib/db/reviews";
import { requireAuth, AuthError } from "../../../lib/auth/middleware";

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/products/prod-1/reviews",
    pathParameters: { id: "prod-1" },
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

describe("List Reviews Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns approved reviews for a product", async () => {
    const reviews = [
      { reviewId: "r1", productId: "prod-1", rating: 5, status: "approved" },
      { reviewId: "r2", productId: "prod-1", rating: 3, status: "pending" },
    ];
    vi.mocked(getReviewsByProduct).mockResolvedValue({ items: reviews as any });

    const result = await listHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].reviewId).toBe("r1");
  });

  it("returns 400 when product ID is missing", async () => {
    const result = await listHandler(
      makeEvent({ pathParameters: null })
    );
    expect(result.statusCode).toBe(400);
  });

  it("returns empty array when no reviews exist", async () => {
    vi.mocked(getReviewsByProduct).mockResolvedValue({ items: [] });

    const result = await listHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toHaveLength(0);
  });

  it("passes limit from query params", async () => {
    vi.mocked(getReviewsByProduct).mockResolvedValue({ items: [] });

    await listHandler(
      makeEvent({ queryStringParameters: { limit: "5" } })
    );

    expect(getReviewsByProduct).toHaveBeenCalledWith("prod-1", {
      limit: 5,
      lastKey: undefined,
    });
  });

  it("returns cursor for pagination", async () => {
    const lastKey = { productId: "prod-1", reviewId: "r5" };
    vi.mocked(getReviewsByProduct).mockResolvedValue({
      items: [],
      lastKey,
    });

    const result = await listHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(body.cursor).toBeDefined();
  });
});

describe("Create Review Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a review for an authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue({
      userId: "user-1",
      email: "test@test.com",
      name: "Test User",
      role: "customer",
    });
    vi.mocked(createReview).mockResolvedValue({
      productId: "prod-1",
      reviewId: "r1",
      userId: "user-1",
      userName: "Test User",
      rating: 5,
      title: "Great product",
      comment: "Really loved it",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({
          rating: 5,
          title: "Great product",
          comment: "Really loved it",
        }),
      })
    );

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.review.rating).toBe(5);
    expect(body.review.status).toBe("pending");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({
          rating: 5,
          title: "Test",
          comment: "Test",
        }),
      })
    );

    expect(result.statusCode).toBe(401);
  });

  it("returns 400 when product ID is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue({
      userId: "user-1",
      email: "test@test.com",
      name: "Test",
      role: "customer",
    });

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        pathParameters: null,
        body: JSON.stringify({
          rating: 5,
          title: "Test",
          comment: "Test",
        }),
      })
    );

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 for invalid rating", async () => {
    vi.mocked(requireAuth).mockReturnValue({
      userId: "user-1",
      email: "test@test.com",
      name: "Test",
      role: "customer",
    });

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({
          rating: 6,
          title: "Test",
          comment: "Test",
        }),
      })
    );

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    vi.mocked(requireAuth).mockReturnValue({
      userId: "user-1",
      email: "test@test.com",
      name: "Test",
      role: "customer",
    });

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ rating: 3 }),
      })
    );

    expect(result.statusCode).toBe(400);
  });
});
