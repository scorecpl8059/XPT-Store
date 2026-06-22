import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock DB module
vi.mock("../../../lib/db/users", () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
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

import { handler as getProfileHandler } from "../get-profile";
import { handler as updateProfileHandler } from "../update-profile";
import { getUserById, updateUser } from "../../../lib/db/users";
import { requireAuth, AuthError } from "../../../lib/auth/middleware";

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/users/me",
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

// ---------- GET PROFILE ----------

describe("Get Profile Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns profile for authenticated user", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getUserById).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      name: "Test User",
      passwordHash: "hashed",
      totpSecret: "secret",
      phone: "123",
    } as any);

    const result = await getProfileHandler(makeEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.userId).toBe("user-1");
    expect(body.email).toBe("test@test.com");
    expect(body.passwordHash).toBeUndefined();
    expect(body.totpSecret).toBeUndefined();
  });

  it("returns 404 when user not found", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getUserById).mockResolvedValue(null as any);

    const result = await getProfileHandler(makeEvent());

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("User not found");
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await getProfileHandler(makeEvent());

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(getUserById).mockRejectedValue(new Error("DB failure"));

    const result = await getProfileHandler(makeEvent());

    expect(result.statusCode).toBe(500);
  });
});

// ---------- UPDATE PROFILE ----------

describe("Update Profile Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates allowed fields and returns profile without sensitive data", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(updateUser).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      name: "Updated Name",
      phone: "555-1234",
      passwordHash: "hashed",
      totpSecret: "secret",
    } as any);

    const result = await updateProfileHandler(
      makeEvent({
        httpMethod: "PUT",
        body: JSON.stringify({ name: "Updated Name", phone: "555-1234" }),
      })
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.name).toBe("Updated Name");
    expect(body.passwordHash).toBeUndefined();
    expect(body.totpSecret).toBeUndefined();
    expect(updateUser).toHaveBeenCalledWith("user-1", {
      name: "Updated Name",
      phone: "555-1234",
    });
  });

  it("returns 400 when no valid fields provided", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);

    const result = await updateProfileHandler(
      makeEvent({
        httpMethod: "PUT",
        body: JSON.stringify({ email: "hack@test.com", role: "admin" }),
      })
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("No valid fields to update");
  });

  it("ignores disallowed fields and updates only allowed ones", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(updateUser).mockResolvedValue({
      userId: "user-1",
      companyName: "XPT-Tech",
      passwordHash: "h",
      totpSecret: "s",
    } as any);

    const result = await updateProfileHandler(
      makeEvent({
        httpMethod: "PUT",
        body: JSON.stringify({ companyName: "XPT-Tech", email: "no@no.com" }),
      })
    );

    expect(result.statusCode).toBe(200);
    expect(updateUser).toHaveBeenCalledWith("user-1", {
      companyName: "XPT-Tech",
    });
  });

  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
      throw new (AuthError as any)("Unauthorized");
    });

    const result = await updateProfileHandler(
      makeEvent({
        httpMethod: "PUT",
        body: JSON.stringify({ name: "New" }),
      })
    );

    expect(result.statusCode).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(requireAuth).mockReturnValue(mockUser);
    vi.mocked(updateUser).mockRejectedValue(new Error("DB failure"));

    const result = await updateProfileHandler(
      makeEvent({
        httpMethod: "PUT",
        body: JSON.stringify({ name: "Fail" }),
      })
    );

    expect(result.statusCode).toBe(500);
  });
});
