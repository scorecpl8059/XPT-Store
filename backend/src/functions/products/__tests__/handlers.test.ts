import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { signAccessToken } from "../../../lib/auth/jwt";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests";
});

vi.mock("../../../lib/db/products", () => ({
  createProduct: vi.fn(),
  getProductById: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock("../../../lib/db/variants", () => ({
  getVariantsByProduct: vi.fn(),
  deleteVariant: vi.fn(),
}));

vi.mock("../../../lib/db/audit-log", () => ({
  createAuditLog: vi.fn().mockResolvedValue({}),
}));

import { createProduct, getProductById, updateProduct, deleteProduct } from "../../../lib/db/products";
import { getVariantsByProduct, deleteVariant } from "../../../lib/db/variants";
import { handler as createHandler } from "../create";
import { handler as updateHandler } from "../update";
import { handler as deleteHandler } from "../delete";

const adminToken = () =>
  signAccessToken({ userId: "admin-1", email: "admin@xpt-tech.com", role: "admin" });

const customerToken = () =>
  signAccessToken({ userId: "user-1", email: "user@example.com", role: "customer" });

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    headers: {},
    body: null,
    httpMethod: "GET",
    path: "/products",
    pathParameters: null,
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

const mockProduct = {
  productId: "prod-1",
  name: "ESP32-S3 DevKit",
  slug: "esp32-s3-devkit",
  description: "WiFi + BLE microcontroller",
  categoryId: "cat-1",
  basePrice: 12.99,
  weight: 0.05,
  images: [],
  status: "draft",
  hasVariants: false,
  relatedProductIds: [],
  averageRating: 0,
  reviewCount: 0,
  totalSold: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const validProductInput = {
  name: "ESP32-S3 DevKit",
  description: "WiFi + BLE microcontroller",
  categoryId: "cat-1",
  basePrice: 12.99,
  weight: 0.05,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /products (create)", () => {
  it("creates product when admin", async () => {
    vi.mocked(createProduct).mockResolvedValue(mockProduct as any);

    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify(validProductInput),
      })
    );
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body).product.name).toBe("ESP32-S3 DevKit");
  });

  it("rejects non-admin users", async () => {
    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${customerToken()}` },
        body: JSON.stringify(validProductInput),
      })
    );
    expect(result.statusCode).toBe(403);
  });

  it("rejects unauthenticated requests", async () => {
    const result = await createHandler(
      makeEvent({ body: JSON.stringify(validProductInput) })
    );
    expect(result.statusCode).toBe(401);
  });

  it("rejects missing required fields", async () => {
    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ name: "Test" }),
      })
    );
    expect(result.statusCode).toBe(400);
  });

  it("rejects negative price", async () => {
    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ ...validProductInput, basePrice: -5 }),
      })
    );
    expect(result.statusCode).toBe(400);
  });

  it("accepts product with variant types", async () => {
    vi.mocked(createProduct).mockResolvedValue({
      ...mockProduct,
      hasVariants: true,
    } as any);

    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          ...validProductInput,
          hasVariants: true,
          variantTypes: [{ name: "Color", values: ["Red", "Blue"] }],
        }),
      })
    );
    expect(result.statusCode).toBe(201);
  });
});

describe("PUT /products/{id} (update)", () => {
  it("updates product when admin", async () => {
    vi.mocked(getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(updateProduct).mockResolvedValue({
      ...mockProduct,
      name: "Updated Name",
    } as any);

    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "prod-1" },
        body: JSON.stringify({ name: "Updated Name" }),
      })
    );
    expect(result.statusCode).toBe(200);
  });

  it("returns 404 for non-existent product", async () => {
    vi.mocked(getProductById).mockResolvedValue(null);

    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "non-existent" },
        body: JSON.stringify({ name: "Updated" }),
      })
    );
    expect(result.statusCode).toBe(404);
  });

  it("rejects invalid status value", async () => {
    vi.mocked(getProductById).mockResolvedValue(mockProduct as any);

    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "prod-1" },
        body: JSON.stringify({ status: "deleted" }),
      })
    );
    expect(result.statusCode).toBe(400);
  });

  it("accepts partial update", async () => {
    vi.mocked(getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(updateProduct).mockResolvedValue({
      ...mockProduct,
      basePrice: 15.99,
    } as any);

    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "prod-1" },
        body: JSON.stringify({ basePrice: 15.99 }),
      })
    );
    expect(result.statusCode).toBe(200);
  });

  it("returns 400 when no ID provided", async () => {
    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ name: "Test" }),
      })
    );
    expect(result.statusCode).toBe(400);
  });
});

describe("DELETE /products/{id}", () => {
  it("deletes product and its variants", async () => {
    vi.mocked(getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(getVariantsByProduct).mockResolvedValue([
      { productId: "prod-1", variantId: "var-1" } as any,
      { productId: "prod-1", variantId: "var-2" } as any,
    ]);
    vi.mocked(deleteVariant).mockResolvedValue(undefined);
    vi.mocked(deleteProduct).mockResolvedValue(undefined);

    const result = await deleteHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "prod-1" },
      })
    );
    expect(result.statusCode).toBe(204);
    expect(deleteVariant).toHaveBeenCalledTimes(2);
    expect(deleteProduct).toHaveBeenCalledWith("prod-1");
  });

  it("returns 404 for non-existent product", async () => {
    vi.mocked(getProductById).mockResolvedValue(null);

    const result = await deleteHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "non-existent" },
      })
    );
    expect(result.statusCode).toBe(404);
  });

  it("rejects non-admin users", async () => {
    const result = await deleteHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${customerToken()}` },
        pathParameters: { id: "prod-1" },
      })
    );
    expect(result.statusCode).toBe(403);
  });
});
