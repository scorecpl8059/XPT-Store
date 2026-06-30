import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { verifyWebhookSignature } from "../../lib/stripe/webhooks";
import { updateOrder } from "../../lib/db/orders";
import { success, badRequest, serverError, initCors } from "../../lib/utils/response";
import type Stripe from "stripe";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    let stripeEvent: Stripe.Event;

    try {
      stripeEvent = verifyWebhookSignature(event);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return badRequest("Invalid webhook signature");
    }

    switch (stripeEvent.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = stripeEvent.data
          .object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          await updateOrder(orderId, { status: "processing" });
          console.log(
            `Order ${orderId} updated to processing (payment succeeded)`
          );
        } else {
          console.warn(
            `payment_intent.succeeded received without orderId in metadata: ${paymentIntent.id}`
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = stripeEvent.data
          .object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          await updateOrder(orderId, { status: "cancelled" });
          console.log(
            `Order ${orderId} updated to cancelled (payment failed)`
          );
        } else {
          console.warn(
            `payment_intent.payment_failed received without orderId in metadata: ${paymentIntent.id}`
          );
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${stripeEvent.type}`);
    }

    return success({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    return serverError();
  }
}
