import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { signAccessToken } from "../../../lib/auth/jwt";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests";
});

vi.mock("../../../lib/db/products", () => ({
  getProductById: vi.fn(),
}));

vi.mock("../../../lib/db/variants", () => ({
  getVariantsByProduct: vi.fn(),
  getVariantBySku: vi.fn(),
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}));

import { getProductById } from "../../../lib/db/products";
import {
  getVariantsByProduct,
  getVariantBySku,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../../../lib/db/variants";
import { handler as listHandler } from "../list";
import { handler as createHandler } from "../create";
import { handler as updateHandler } from "../update";
import { handler as deleteHandler } from "../delete";

const adminToken = () =>
  signAccessToken({ userId: "admin-1", email: "admin@xpt-tech.com", role: "admin" });

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    headers: {},
    body: null,
    httpMethod: "GET",
    path: "/products/prod-1/variants",
    pathParameters: { id: "prod-1" },
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    resource: "",
    isBase64Encoded: false,
    ...overrides,
  };
}

const mockVariant = {
  productId: "prod-1",
  variantId: "var-1",
  sku: "ESP32-RED",
  attributes: { color: "Red" },
  price: 14.99,
  stock: 50,
  reservedStock: 0,
  weight: 0.05,
  status: "active",
};

const mockProduct = {
  productId: "prod-1",
  name: "ESP32",
  hasVariants: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /products/{id}/variants", () => {
  it("lists variants for a product", async () => {
    vi.mocked(getVariantsByProduct).mockResolvedValue([mockVariant as any]);

    const result = await listHandler(makeEvent());
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).variants).toHaveLength(1);
  });

  it("returns 400 when no product ID", async () => {
    const result = await listHandler(makeEvent({ pathParameters: null }));
    expect(result.statusCode).toBe(400);
  });
});

describe("POST /products/{id}/variants", () => {
  it("creates variant when admin", async () => {
    vi.mocked(getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(getVariantBySku).mockResolvedValue(null);
    vi.mocked(createVariant).mockResolvedValue(mockVariant as any);

    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          sku: "ESP32-RED",
          attributes: { color: "Red" },
          price: 14.99,
          stock: 50,
          weight: 0.05,
        }),
      })
    );
    expect(result.statusCode).toBe(201);
  });

  it("rejects duplicate SKU", async () => {
    vi.mocked(getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(getVariantBySku).mockResolvedValue(mockVariant as any);

    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          sku: "ESP32-RED",
          attributes: { color: "Red" },
          price: 14.99,
          stock: 50,
          weight: 0.05,
        }),
      })
    );
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain("SKU");
  });

  it("returns 404 when product does not exist", async () => {
    vi.mocked(getProductById).mockResolvedValue(null);

    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          sku: "TEST-1",
          attributes: {},
          price: 10,
          stock: 5,
          weight: 0.1,
        }),
      })
    );
    expect(result.statusCode).toBe(404);
  });

  it("rejects missing SKU", async () => {
    vi.mocked(getProductById).mockResolvedValue(mockProduct as any);

    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          attributes: {},
          price: 10,
          stock: 5,
          weight: 0.1,
        }),
      })
    );
    expect(result.statusCode).toBe(400);
  });
});

describe("PUT /products/{id}/variants/{variantId}", () => {
  it("updates variant", async () => {
    vi.mocked(updateVariant).mockResolvedValue({
      ...mockVariant,
      price: 19.99,
    } as any);

    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "prod-1", variantId: "var-1" },
        body: JSON.stringify({ price: 19.99 }),
      })
    );
    expect(result.statusCode).toBe(200);
  });

  it("returns 404 when variant not found", async () => {
    vi.mocked(updateVariant).mockResolvedValue(null);

    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "prod-1", variantId: "non-existent" },
        body: JSON.stringify({ price: 19.99 }),
      })
    );
    expect(result.statusCode).toBe(404);
  });

  it("returns 400 with missing path params", async () => {
    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "prod-1" },
        body: JSON.stringify({ price: 19.99 }),
      })
    );
    expect(result.statusCode).toBe(400);
  });
});

describe("DELETE /products/{id}/variants/{variantId}", () => {
  it("deletes variant", async () => {
    vi.mocked(deleteVariant).mockResolvedValue(undefined);

    const result = await deleteHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "prod-1", variantId: "var-1" },
      })
    );
    expect(result.statusCode).toBe(204);
  });
});
