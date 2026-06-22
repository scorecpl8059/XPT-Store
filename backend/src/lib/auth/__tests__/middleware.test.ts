import { describe, it, expect, beforeAll } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { getAuthUser, requireAuth, requireAdmin, AuthError } from "../middleware";
import { signAccessToken } from "../jwt";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests";
});

function makeEvent(headers: Record<string, string> = {}): APIGatewayProxyEvent {
  return {
    headers,
    body: null,
    httpMethod: "GET",
    path: "/test",
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    resource: "",
    isBase64Encoded: false,
  };
}

describe("getAuthUser", () => {
  it("returns null when no Authorization header", () => {
    const event = makeEvent();
    expect(getAuthUser(event)).toBeNull();
  });

  it("returns null for non-Bearer auth", () => {
    const event = makeEvent({ Authorization: "Basic abc123" });
    expect(getAuthUser(event)).toBeNull();
  });

  it("returns null for invalid token", () => {
    const event = makeEvent({ Authorization: "Bearer invalid.token" });
    expect(getAuthUser(event)).toBeNull();
  });

  it("returns payload for valid token", () => {
    const token = signAccessToken({
      userId: "user-1",
      email: "test@example.com",
      role: "customer",
    });
    const event = makeEvent({ Authorization: `Bearer ${token}` });
    const user = getAuthUser(event);
    expect(user).not.toBeNull();
    expect(user!.userId).toBe("user-1");
    expect(user!.email).toBe("test@example.com");
  });

  it("handles lowercase authorization header", () => {
    const token = signAccessToken({
      userId: "user-2",
      email: "test2@example.com",
      role: "admin",
    });
    const event = makeEvent({ authorization: `Bearer ${token}` });
    const user = getAuthUser(event);
    expect(user).not.toBeNull();
    expect(user!.userId).toBe("user-2");
  });
});

describe("requireAuth", () => {
  it("returns payload for valid token", () => {
    const token = signAccessToken({
      userId: "user-1",
      email: "test@example.com",
      role: "customer",
    });
    const event = makeEvent({ Authorization: `Bearer ${token}` });
    const user = requireAuth(event);
    expect(user.userId).toBe("user-1");
  });

  it("throws AuthError for missing token", () => {
    const event = makeEvent();
    expect(() => requireAuth(event)).toThrow(AuthError);
    try {
      requireAuth(event);
    } catch (err) {
      expect((err as AuthError).statusCode).toBe(401);
    }
  });
});

describe("requireAdmin", () => {
  it("returns payload for admin user", () => {
    const token = signAccessToken({
      userId: "admin-1",
      email: "admin@xpt-tech.com",
      role: "admin",
    });
    const event = makeEvent({ Authorization: `Bearer ${token}` });
    const user = requireAdmin(event);
    expect(user.role).toBe("admin");
  });

  it("throws AuthError for customer user", () => {
    const token = signAccessToken({
      userId: "user-1",
      email: "customer@example.com",
      role: "customer",
    });
    const event = makeEvent({ Authorization: `Bearer ${token}` });
    expect(() => requireAdmin(event)).toThrow(AuthError);
    try {
      requireAdmin(event);
    } catch (err) {
      expect((err as AuthError).statusCode).toBe(403);
    }
  });

  it("throws 401 for missing token", () => {
    const event = makeEvent();
    try {
      requireAdmin(event);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).statusCode).toBe(401);
    }
  });
});
