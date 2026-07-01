import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mock modules
vi.mock("../../../lib/stripe/webhooks", () => ({
  verifyWebhookSignature: vi.fn(),
}));

vi.mock("../../../lib/db/orders", () => ({
  updateOrder: vi.fn(),
}));

import { handler } from "../stripe";
import { verifyWebhookSignature } from "../../../lib/stripe/webhooks";
import { updateOrder } from "../../../lib/db/orders";

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: "POST",
    path: "/webhooks/stripe",
    pathParameters: null,
    queryStringParameters: null,
    headers: { "stripe-signature": "sig_test" },
    body: "{}",
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
    ...overrides,
  };
}

describe("Stripe Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates order to processing on payment_intent.succeeded", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_123",
          metadata: { orderId: "ord-1", userId: "user-1" },
        },
      },
    } as any);
    vi.mocked(updateOrder).mockResolvedValue({} as any);

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).received).toBe(true);
    expect(updateOrder).toHaveBeenCalledWith("ord-1", {
      status: "processing",
    });
  });

  it("updates order to cancelled on payment_intent.payment_failed", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue({
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_456",
          metadata: { orderId: "ord-2", userId: "user-1" },
        },
      },
    } as any);
    vi.mocked(updateOrder).mockResolvedValue({} as any);

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(200);
    expect(updateOrder).toHaveBeenCalledWith("ord-2", {
      status: "refunded",
    });
  });

  it("handles succeeded event without orderId in metadata", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_789",
          metadata: {},
        },
      },
    } as any);

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(200);
    expect(updateOrder).not.toHaveBeenCalled();
  });

  it("handles payment_failed event without orderId in metadata", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue({
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_000",
          metadata: {},
        },
      },
    } as any);

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(200);
    expect(updateOrder).not.toHaveBeenCalled();
  });

  it("handles unrecognized event types gracefully", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue({
      type: "customer.created",
      data: { object: {} },
    } as any);

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).received).toBe(true);
    expect(updateOrder).not.toHaveBeenCalled();
  });

  it("returns 400 when signature verification fails", async () => {
    vi.mocked(verifyWebhookSignature).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Invalid webhook signature");
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_err",
          metadata: { orderId: "ord-err" },
        },
      },
    } as any);
    vi.mocked(updateOrder).mockRejectedValue(new Error("DB failure"));

    const result = await handler(makeEvent());

    expect(result.statusCode).toBe(500);
  });
});
