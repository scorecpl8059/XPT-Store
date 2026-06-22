import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateOrder } from "../../lib/db/orders";
import {
  success,
  badRequest,
  notFound,
  unauthorized,
  serverError,
} from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("Order ID is required");
    }

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const updates = JSON.parse(event.body);
    const { status, trackingNumber, carrier, estimatedDelivery } = updates;

    const orderUpdates: Record<string, unknown> = {};
    if (status !== undefined) orderUpdates.status = status;
    if (trackingNumber !== undefined) orderUpdates.trackingNumber = trackingNumber;
    if (carrier !== undefined) orderUpdates.carrier = carrier;
    if (estimatedDelivery !== undefined) orderUpdates.estimatedDelivery = estimatedDelivery;

    if (status === "shipped" && !updates.shippedAt) {
      orderUpdates.shippedAt = new Date().toISOString();
    }

    if (status === "delivered") {
      orderUpdates.deliveredAt = new Date().toISOString();
    }

    const order = await updateOrder(id, orderUpdates);
    if (!order) {
      return notFound("Order not found");
    }

    return success({ order });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error updating order:", error);
    return serverError();
  }
}
