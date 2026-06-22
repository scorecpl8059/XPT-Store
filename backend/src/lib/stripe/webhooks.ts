import type { APIGatewayProxyEvent } from "aws-lambda";
import { stripe } from "./client";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Verify that a webhook event is genuinely from Stripe.
 * Throws if the signature is invalid.
 */
export function verifyWebhookSignature(
  event: APIGatewayProxyEvent
): Stripe.Event {
  const signature = event.headers["Stripe-Signature"] || event.headers["stripe-signature"];

  if (!signature) {
    throw new Error("Missing Stripe-Signature header");
  }

  if (!WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  // event.body is the raw body string from API Gateway
  return stripe.webhooks.constructEvent(
    event.body || "",
    signature,
    WEBHOOK_SECRET
  );
}
