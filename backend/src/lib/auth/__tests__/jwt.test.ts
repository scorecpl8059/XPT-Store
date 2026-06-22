import { describe, it, expect, beforeAll } from "vitest";
import { signAccessToken, signRefreshToken, verifyToken } from "../jwt";
import type { JwtPayload } from "../jwt";

// Set JWT_SECRET for tests
beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests";
});

describe("signAccessToken", () => {
  it("returns a JWT string", () => {
    const token = signAccessToken({
      userId: "user-1",
      email: "test@example.com",
      role: "customer",
    });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });
});

describe("signRefreshToken", () => {
  it("returns a JWT string", () => {
    const token = signRefreshToken("user-1");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });
});

describe("verifyToken", () => {
  it("decodes a valid access token", () => {
    const payload: JwtPayload = {
      userId: "user-123",
      email: "admin@xpt-tech.com",
      role: "admin",
    };
    const token = signAccessToken(payload);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe("user-123");
    expect(decoded.email).toBe("admin@xpt-tech.com");
    expect(decoded.role).toBe("admin");
  });

  it("throws on invalid token", () => {
    expect(() => verifyToken("invalid.token.here")).toThrow();
  });

  it("throws on tampered token", () => {
    const token = signAccessToken({
      userId: "user-1",
      email: "test@example.com",
      role: "customer",
    });
    // Tamper with the payload
    const parts = token.split(".");
    parts[1] = parts[1] + "tampered";
    expect(() => verifyToken(parts.join("."))).toThrow();
  });

  it("preserves all payload fields through sign/verify cycle", () => {
    const payload: JwtPayload = {
      userId: "uid-abc",
      email: "user@test.com",
      role: "customer",
    };
    const token = signAccessToken(payload);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });
});
