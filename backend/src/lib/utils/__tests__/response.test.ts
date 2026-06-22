import { describe, it, expect } from "vitest";
import {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from "../response";

describe("success", () => {
  it("returns 200 with JSON body", () => {
    const result = success({ message: "OK" });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ message: "OK" });
  });

  it("includes CORS headers", () => {
    const result = success({});
    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin");
    expect(result.headers).toHaveProperty("Access-Control-Allow-Methods");
  });

  it("includes security headers", () => {
    const result = success({});
    expect(result.headers).toHaveProperty("X-Content-Type-Options", "nosniff");
    expect(result.headers).toHaveProperty("X-Frame-Options", "DENY");
    expect(result.headers).toHaveProperty("Strict-Transport-Security");
    expect(result.headers).toHaveProperty("Referrer-Policy");
  });

  it("accepts custom status code", () => {
    const result = success({ data: "test" }, 202);
    expect(result.statusCode).toBe(202);
  });
});

describe("created", () => {
  it("returns 201", () => {
    const result = created({ id: "new-1" });
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toEqual({ id: "new-1" });
  });
});

describe("noContent", () => {
  it("returns 204 with empty body", () => {
    const result = noContent();
    expect(result.statusCode).toBe(204);
    expect(result.body).toBe("");
  });
});

describe("badRequest", () => {
  it("returns 400 with error message", () => {
    const result = badRequest("Invalid input");
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ error: "Invalid input" });
  });
});

describe("unauthorized", () => {
  it("returns 401 with default message", () => {
    const result = unauthorized();
    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body)).toEqual({ error: "Unauthorized" });
  });

  it("accepts custom message", () => {
    const result = unauthorized("Token expired");
    expect(JSON.parse(result.body)).toEqual({ error: "Token expired" });
  });
});

describe("forbidden", () => {
  it("returns 403 with default message", () => {
    const result = forbidden();
    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body)).toEqual({ error: "Forbidden" });
  });
});

describe("notFound", () => {
  it("returns 404 with default message", () => {
    const result = notFound();
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ error: "Not found" });
  });

  it("accepts custom message", () => {
    const result = notFound("Product not found");
    expect(JSON.parse(result.body)).toEqual({ error: "Product not found" });
  });
});

describe("serverError", () => {
  it("returns 500 with default message", () => {
    const result = serverError();
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: "Internal server error",
    });
  });
});
