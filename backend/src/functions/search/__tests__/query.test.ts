import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock OpenSearch module
vi.mock("../../../lib/aws/opensearch", () => ({
  searchProducts: vi.fn(),
}));

// Mock search logs module
vi.mock("../../../lib/db/search-logs", () => ({
  logSearch: vi.fn(),
}));

// Mock auth middleware
vi.mock("../../../lib/auth/middleware", () => ({
  getAuthUser: vi.fn(),
}));

import { handler } from "../query";
import { searchProducts } from "../../../lib/aws/opensearch";
import { logSearch } from "../../../lib/db/search-logs";
import { getAuthUser } from "../../../lib/auth/middleware";

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/search",
    pathParameters: null,
    queryStringParameters: { q: "resistor" },
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

describe("Search Query Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(logSearch).mockResolvedValue(undefined as any);
    vi.mocked(getAuthUser).mockReturnValue(null);
  });

  it("returns 400 when no query param", async () => {
    const result = await handler(makeEvent({ queryStringParameters: null }));
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Search query is required");
  });

  it("returns 400 when query is empty/whitespace", async () => {
    const result = await handler(
      makeEvent({ queryStringParameters: { q: "   " } })
    );
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Search query is required");
  });

  it("returns search results successfully", async () => {
    const hits = [
      { productId: "p1", name: "100k Resistor" },
      { productId: "p2", name: "10k Resistor" },
    ];
    vi.mocked(searchProducts).mockResolvedValue({ hits, total: 2 });

    const result = await handler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.size).toBe(20);
    expect(searchProducts).toHaveBeenCalledWith({
      query: "resistor",
      categoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      from: 0,
      size: 20,
    });
  });

  it("passes categoryId filter", async () => {
    vi.mocked(searchProducts).mockResolvedValue({ hits: [], total: 0 });

    await handler(
      makeEvent({
        queryStringParameters: { q: "resistor", categoryId: "cat-1" },
      })
    );

    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "cat-1" })
    );
  });

  it("passes price range filters", async () => {
    vi.mocked(searchProducts).mockResolvedValue({ hits: [], total: 0 });

    await handler(
      makeEvent({
        queryStringParameters: {
          q: "capacitor",
          minPrice: "1.50",
          maxPrice: "25.99",
        },
      })
    );

    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "capacitor",
        minPrice: 1.5,
        maxPrice: 25.99,
      })
    );
  });

  it("passes pagination params", async () => {
    vi.mocked(searchProducts).mockResolvedValue({ hits: [], total: 0 });

    const result = await handler(
      makeEvent({
        queryStringParameters: { q: "led", page: "3", size: "10" },
      })
    );

    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 20, // (3 - 1) * 10
        size: 10,
      })
    );
    const body = JSON.parse(result.body);
    expect(body.page).toBe(3);
    expect(body.size).toBe(10);
  });

  it("handles searchProducts error gracefully (500)", async () => {
    vi.mocked(searchProducts).mockRejectedValue(new Error("OpenSearch down"));

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(500);
  });

  it("calls logSearch non-blocking (doesn't await)", async () => {
    vi.mocked(searchProducts).mockResolvedValue({ hits: [], total: 0 });
    // Make logSearch hang forever — if handler awaited it, the test would time out
    vi.mocked(logSearch).mockReturnValue(new Promise(() => {}) as any);

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(200);
    expect(logSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "resistor",
        resultCount: 0,
      })
    );
  });

  it("includes userId in logSearch when authenticated", async () => {
    vi.mocked(searchProducts).mockResolvedValue({ hits: [], total: 5 });
    vi.mocked(getAuthUser).mockReturnValue({
      userId: "user-42",
      email: "test@test.com",
      name: "Test User",
      role: "customer",
    });

    await handler(makeEvent());

    expect(logSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "resistor",
        resultCount: 5,
        userId: "user-42",
      })
    );
  });
});
