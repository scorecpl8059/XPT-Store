import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getOrderById } from "../../lib/db/orders";
import { success, badRequest, notFound, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    const orderId = event.pathParameters?.orderId;
    if (!orderId) {
      return badRequest("Order ID is required");
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return notFound("Order not found");
    }

    // Verify ownership or admin access
    if (user.userId !== order.userId && user.role !== "admin") {
      return forbidden("You do not have access to this order");
    }

    return success({ order });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Get invoice error:", err);
    return serverError();
  }
}
