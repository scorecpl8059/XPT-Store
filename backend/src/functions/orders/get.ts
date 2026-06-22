import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getOrderById } from "../../lib/db/orders";
import {
  success,
  badRequest,
  unauthorized,
  notFound,
  serverError,
} from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return badRequest("Order ID is required");
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return notFound("Order not found");
    }

    // Only allow the order owner or admins to view
    if (order.userId !== user.userId && user.role !== "admin") {
      return notFound("Order not found");
    }

    return success(order);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error getting order:", error);
    return serverError();
  }
}
