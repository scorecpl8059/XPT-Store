import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock DB modules
vi.mock("../../../lib/db/products", () => ({
  getProductById: vi.fn(),
}));

vi.mock("../../../lib/db/variants", () => ({
  getVariantsByProduct: vi.fn(),
}));

vi.mock("../../../lib/db/shipping", () => ({
  calculateShippingRate: vi.fn(),
}));

import { handler } from "../calculate";
import { getProductById } from "../../../lib/db/products";
import { getVariantsByProduct } from "../../../lib/db/variants";
import { calculateShippingRate } from "../../../lib/db/shipping";

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: "POST",
    path: "/shipping/calculate",
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

describe("Calculate Shipping Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates shipping cost for items with product weights", async () => {
    vi.mocked(getProductById).mockResolvedValue({
      productId: "p1",
      name: "Widget",
      weight: 2.0,
    } as any);
    vi.mocked(calculateShippingRate).mockResolvedValue({
      rate: { price: 9.99 },
      zone: { name: "Continental US" },
    } as any);

    const result = await handler(
      makeEvent({
        body: JSON.stringify({
          state: "TX",
          items: [{ productId: "p1", quantity: 3 }],
        }),
      })
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(200);
    expect(body.shippingCost).toBe(9.99);
    expect(body.zone).toBe("Continental US");
    expect(calculateShippingRate).toHaveBeenCalledWith("TX", 6.0);
  });

  it("uses variant weight when variantId is provided", async () => {
    vi.mocked(getProductById).mockResolvedValue({
      productId: "p1",
      weight: 1.0,
    } as any);
    vi.mocked(getVariantsByProduct).mockResolvedValue([
      { variantId: "v1", weight: 3.0 },
    ] as any);
    vi.mocked(calculateShippingRate).mockResolvedValue({
      rate: { price: 12.5 },
      zone: { name: "West Coast" },
    } as any);

    const result = await handler(
      makeEvent({
        body: JSON.stringify({
          state: "CA",
          items: [{ productId: "p1", variantId: "v1", quantity: 2 }],
        }),
      })
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(200);
    expect(body.shippingCost).toBe(12.5);
    expect(calculateShippingRate).toHaveBeenCalledWith("CA", 6.0);
  });

  it("falls back to default weight (0.5) when product has no weight", async () => {
    vi.mocked(getProductById).mockResolvedValue({
      productId: "p1",
      weight: undefined,
    } as any);
    vi.mocked(calculateShippingRate).mockResolvedValue({
      rate: { price: 3.0 },
      zone: { name: "Local" },
    } as any);

    await handler(
      makeEvent({
        body: JSON.stringify({
          state: "TX",
          items: [{ productId: "p1", quantity: 1 }],
        }),
      })
    );

    expect(calculateShippingRate).toHaveBeenCalledWith("TX", 0.5);
  });

  it("returns free shipping when calculateShippingRate returns null", async () => {
    vi.mocked(getProductById).mockResolvedValue({
      productId: "p1",
      weight: 1.0,
    } as any);
    vi.mocked(calculateShippingRate).mockResolvedValue(null as any);

    const result = await handler(
      makeEvent({
        body: JSON.stringify({
          state: "TX",
          items: [{ productId: "p1", quantity: 1 }],
        }),
      })
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(200);
    expect(body.shippingCost).toBe(0);
    expect(body.zone).toBe("Free shipping");
  });

  it("returns 400 when body is missing", async () => {
    const result = await handler(makeEvent({ body: null }));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Request body is required");
  });

  it("returns 400 when state is missing", async () => {
    const result = await handler(
      makeEvent({
        body: JSON.stringify({
          items: [{ productId: "p1", quantity: 1 }],
        }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("State is required");
  });

  it("returns 400 when items array is empty", async () => {
    const result = await handler(
      makeEvent({
        body: JSON.stringify({ state: "TX", items: [] }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Items array is required");
  });

  it("returns 400 when items is missing", async () => {
    const result = await handler(
      makeEvent({
        body: JSON.stringify({ state: "TX" }),
      })
    );

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when product not found", async () => {
    vi.mocked(getProductById).mockResolvedValue(null as any);

    const result = await handler(
      makeEvent({
        body: JSON.stringify({
          state: "TX",
          items: [{ productId: "missing", quantity: 1 }],
        }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Product not found: missing");
  });
});
