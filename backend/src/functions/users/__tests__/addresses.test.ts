import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock DB module
vi.mock("../../../lib/db/addresses", () => ({
  getAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
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

import { handler as listHandler } from "../list-addresses";
import { handler as createHandler } from "../create-address";
import { handler as updateHandler } from "../update-address";
import { handler as deleteHandler } from "../delete-address";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../../../lib/db/addresses";
import { requireAuth, AuthError } from "../../../lib/auth/middleware";

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/users/me/addresses",
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

// ---------- LIST ADDRESSES ----------

describe("List Addresses Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns addresses for authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getAddresses).mockResolvedValue([
      { addressId: "a1", recipientName: "Alice", street1: "123 Main St" },
    ] as any);

    const result = await listHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].addressId).toBe("a1");
    expect(getAddresses).toHaveBeenCalledWith("user-1");
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
    vi.mocked(getAddresses).mockRejectedValue(new Error("DB failure"));

    const result = await listHandler(makeEvent());

    expect(result.statusCode).toBe(500);
  });
});

// ---------- CREATE ADDRESS ----------

describe("Create Address Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an address and returns 201", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    const addressData = { recipientName: "Alice", street1: "123 Main St", city: "Taipei" };
    vi.mocked(createAddress).mockResolvedValue({
      addressId: "a1",
      ...addressData,
    } as any);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify(addressData),
      })
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(201);
    expect(body.addressId).toBe("a1");
    expect(createAddress).toHaveBeenCalledWith("user-1", addressData);
  });

  it("returns 400 when recipientName is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ street1: "123 Main St" }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe(
      "recipientName and street1 are required"
    );
  });

  it("returns 400 when street1 is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ recipientName: "Alice" }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe(
      "recipientName and street1 are required"
    );
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await createHandler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ recipientName: "A", street1: "B" }),
      })
    );

    expect(result.statusCode).toBe(401);
  });
});

// ---------- UPDATE ADDRESS ----------

describe("Update Address Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an address and returns success", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(updateAddress).mockResolvedValue({
      addressId: "a1",
      recipientName: "Bob",
      street1: "456 Oak Ave",
    } as any);

    const result = await updateHandler(
      makeEvent({
        httpMethod: "PUT",
        pathParameters: { addressId: "a1" },
        body: JSON.stringify({ recipientName: "Bob" }),
      })
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.recipientName).toBe("Bob");
    expect(updateAddress).toHaveBeenCalledWith("user-1", "a1", {
      recipientName: "Bob",
    });
  });

  it("returns 400 when addressId path parameter is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await updateHandler(
      makeEvent({
        httpMethod: "PUT",
        pathParameters: null,
        body: JSON.stringify({ recipientName: "Bob" }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Address ID is required");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await updateHandler(
      makeEvent({
        httpMethod: "PUT",
        pathParameters: { addressId: "a1" },
        body: JSON.stringify({ recipientName: "Bob" }),
      })
    );

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(updateAddress).mockRejectedValue(new Error("DB failure"));

    const result = await updateHandler(
      makeEvent({
        httpMethod: "PUT",
        pathParameters: { addressId: "a1" },
        body: JSON.stringify({ recipientName: "Bob" }),
      })
    );

    expect(result.statusCode).toBe(500);
  });
});

// ---------- DELETE ADDRESS ----------

describe("Delete Address Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes an address and returns 204", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(deleteAddress).mockResolvedValue(undefined as any);

    const result = await deleteHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { addressId: "a1" },
      })
    );

    expect(result.statusCode).toBe(204);
    expect(result.body).toBe("");
    expect(deleteAddress).toHaveBeenCalledWith("user-1", "a1");
  });

  it("returns 400 when addressId path parameter is missing", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await deleteHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: null,
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Address ID is required");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await deleteHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { addressId: "a1" },
      })
    );

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(deleteAddress).mockRejectedValue(new Error("DB failure"));

    const result = await deleteHandler(
      makeEvent({
        httpMethod: "DELETE",
        pathParameters: { addressId: "a1" },
      })
    );

    expect(result.statusCode).toBe(500);
  });
});
