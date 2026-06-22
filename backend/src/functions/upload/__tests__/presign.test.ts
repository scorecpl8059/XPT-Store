import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { signAccessToken } from "../../../lib/auth/jwt";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests";
});

vi.mock("../../../lib/aws/s3", () => ({
  generatePresignedUploadUrl: vi.fn().mockResolvedValue("https://s3.example.com/presigned-url"),
}));

import { handler } from "../presign";

const adminToken = () =>
  signAccessToken({ userId: "admin-1", email: "admin@xpt-tech.com", role: "admin" });

const customerToken = () =>
  signAccessToken({ userId: "user-1", email: "user@example.com", role: "customer" });

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    headers: {},
    body: null,
    httpMethod: "POST",
    path: "/upload/presign",
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /upload/presign", () => {
  it("returns presigned URL for admin uploading product image", async () => {
    const result = await handler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          folder: "products",
          entityId: "prod-1",
          filename: "photo.jpg",
          contentType: "image/jpeg",
        }),
      })
    );
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.uploadUrl).toBe("https://s3.example.com/presigned-url");
    expect(body.key).toContain("products/prod-1/");
    expect(body.key).toContain("photo.jpg");
  });

  it("allows customers to upload review images", async () => {
    const result = await handler(
      makeEvent({
        headers: { Authorization: `Bearer ${customerToken()}` },
        body: JSON.stringify({
          folder: "reviews",
          entityId: "rev-1",
          filename: "review.png",
          contentType: "image/png",
        }),
      })
    );
    expect(result.statusCode).toBe(200);
  });

  it("blocks customers from uploading product images", async () => {
    const result = await handler(
      makeEvent({
        headers: { Authorization: `Bearer ${customerToken()}` },
        body: JSON.stringify({
          folder: "products",
          entityId: "prod-1",
          filename: "hack.jpg",
          contentType: "image/jpeg",
        }),
      })
    );
    expect(result.statusCode).toBe(403);
  });

  it("blocks customers from uploading category images", async () => {
    const result = await handler(
      makeEvent({
        headers: { Authorization: `Bearer ${customerToken()}` },
        body: JSON.stringify({
          folder: "categories",
          entityId: "cat-1",
          filename: "img.jpg",
          contentType: "image/jpeg",
        }),
      })
    );
    expect(result.statusCode).toBe(403);
  });

  it("rejects unauthenticated requests", async () => {
    const result = await handler(
      makeEvent({
        body: JSON.stringify({
          folder: "reviews",
          entityId: "rev-1",
          filename: "photo.jpg",
          contentType: "image/jpeg",
        }),
      })
    );
    expect(result.statusCode).toBe(401);
  });

  it("rejects invalid content type", async () => {
    const result = await handler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          folder: "products",
          entityId: "prod-1",
          filename: "malware.exe",
          contentType: "application/x-executable",
        }),
      })
    );
    expect(result.statusCode).toBe(400);
  });

  it("rejects invalid folder", async () => {
    const result = await handler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          folder: "../../etc",
          entityId: "1",
          filename: "test.jpg",
          contentType: "image/jpeg",
        }),
      })
    );
    expect(result.statusCode).toBe(400);
  });

  it("sanitizes filename", async () => {
    const result = await handler(
      makeEvent({
        headers: { Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          folder: "products",
          entityId: "prod-1",
          filename: "my photo (1).jpg",
          contentType: "image/jpeg",
        }),
      })
    );
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    // Spaces and parens should be replaced with underscores
    expect(body.key).not.toContain(" ");
    expect(body.key).not.toContain("(");
  });
});
