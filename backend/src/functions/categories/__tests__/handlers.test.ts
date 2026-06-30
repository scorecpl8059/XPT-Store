import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { signAccessToken } from "../../../lib/auth/jwt";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests";
});

// Mock DynamoDB
vi.mock("../../../lib/db/categories", () => ({
  listAllCategories: vi.fn(),
  listChildCategories: vi.fn(),
  getCategoryById: vi.fn(),
  getCategoryBySlug: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

vi.mock("../../../lib/db/audit-log", () => ({
  createAuditLog: vi.fn().mockResolvedValue({}),
}));

import { listAllCategories, listChildCategories, getCategoryById, getCategoryBySlug, createCategory, updateCategory, deleteCategory } from "../../../lib/db/categories";
import { handler as listHandler } from "../list";
import { handler as getHandler } from "../get";
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
    path: "/categories",
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

const mockCategory = {
  categoryId: "cat-1",
  name: "Microcontrollers",
  slug: "microcontrollers",
  status: "active",
  productCount: 10,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /categories (list)", () => {
  it("returns all categories", async () => {
    vi.mocked(listAllCategories).mockResolvedValue([mockCategory as any]);

    const result = await listHandler(makeEvent());
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0].name).toBe("Microcontrollers");
  });

  it("filters by parentId when provided", async () => {
    vi.mocked(listChildCategories).mockResolvedValue([]);

    const result = await listHandler(
      makeEvent({ queryStringParameters: { parentId: "parent-1" } })
    );
    expect(result.statusCode).toBe(200);
    expect(listChildCategories).toHaveBeenCalledWith("parent-1");
  });
});

describe("GET /categories/{id}", () => {
  it("returns category by ID", async () => {
    vi.mocked(getCategoryById).mockResolvedValue(mockCategory as any);

    const result = await getHandler(
      makeEvent({ pathParameters: { id: "cat-1" } })
    );
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).category.name).toBe("Microcontrollers");
  });

  it("returns category by slug", async () => {
    vi.mocked(getCategoryBySlug).mockResolvedValue(mockCategory as any);

    const result = await getHandler(
      makeEvent({
        pathParameters: { id: "microcontrollers" },
        queryStringParameters: { by: "slug" },
      })
    );
    expect(result.statusCode).toBe(200);
    expect(getCategoryBySlug).toHaveBeenCalledWith("microcontrollers");
  });

  it("returns 404 for non-existent category", async () => {
    vi.mocked(getCategoryById).mockResolvedValue(null);

    const result = await getHandler(
      makeEvent({ pathParameters: { id: "non-existent" } })
    );
    expect(result.statusCode).toBe(404);
  });

  it("returns 400 when no ID provided", async () => {
    const result = await getHandler(makeEvent());
    expect(result.statusCode).toBe(400);
  });
});

describe("POST /categories (create)", () => {
  it("creates category when admin", async () => {
    vi.mocked(createCategory).mockResolvedValue(mockCategory as any);

    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ name: "Microcontrollers" }),
      })
    );
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body).category.name).toBe("Microcontrollers");
  });

  it("rejects non-admin users", async () => {
    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${customerToken()}` },
        body: JSON.stringify({ name: "Test" }),
      })
    );
    expect(result.statusCode).toBe(403);
  });

  it("rejects unauthenticated requests", async () => {
    const result = await createHandler(
      makeEvent({ body: JSON.stringify({ name: "Test" }) })
    );
    expect(result.statusCode).toBe(401);
  });

  it("rejects invalid input", async () => {
    const result = await createHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ name: "" }),
      })
    );
    expect(result.statusCode).toBe(400);
  });
});

describe("PUT /categories/{id} (update)", () => {
  it("updates category when admin", async () => {
    vi.mocked(getCategoryById).mockResolvedValue(mockCategory as any);
    vi.mocked(updateCategory).mockResolvedValue({
      ...mockCategory,
      name: "Updated",
    } as any);

    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "cat-1" },
        body: JSON.stringify({ name: "Updated" }),
      })
    );
    expect(result.statusCode).toBe(200);
  });

  it("returns 404 for non-existent category", async () => {
    vi.mocked(getCategoryById).mockResolvedValue(null);

    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "non-existent" },
        body: JSON.stringify({ name: "Updated" }),
      })
    );
    expect(result.statusCode).toBe(404);
  });

  it("rejects non-admin users", async () => {
    const result = await updateHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${customerToken()}` },
        pathParameters: { id: "cat-1" },
        body: JSON.stringify({ name: "Hack" }),
      })
    );
    expect(result.statusCode).toBe(403);
  });
});

describe("DELETE /categories/{id}", () => {
  it("deletes category when admin and no children/products", async () => {
    vi.mocked(getCategoryById).mockResolvedValue(mockCategory as any);
    vi.mocked(listChildCategories).mockResolvedValue([]);
    // Override productCount to 0
    vi.mocked(getCategoryById).mockResolvedValue({
      ...mockCategory,
      productCount: 0,
    } as any);
    vi.mocked(deleteCategory).mockResolvedValue(undefined);

    const result = await deleteHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "cat-1" },
      })
    );
    expect(result.statusCode).toBe(204);
  });

  it("rejects deletion of category with children", async () => {
    vi.mocked(getCategoryById).mockResolvedValue({
      ...mockCategory,
      productCount: 0,
    } as any);
    vi.mocked(listChildCategories).mockResolvedValue([mockCategory as any]);

    const result = await deleteHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "cat-1" },
      })
    );
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain("subcategories");
  });

  it("rejects deletion of category with products", async () => {
    vi.mocked(getCategoryById).mockResolvedValue({
      ...mockCategory,
      productCount: 5,
    } as any);
    vi.mocked(listChildCategories).mockResolvedValue([]);

    const result = await deleteHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "cat-1" },
      })
    );
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain("products");
  });

  it("returns 404 for non-existent category", async () => {
    vi.mocked(getCategoryById).mockResolvedValue(null);

    const result = await deleteHandler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        pathParameters: { id: "non-existent" },
      })
    );
    expect(result.statusCode).toBe(404);
  });
});
