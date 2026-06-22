import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getOrderById } from "../../lib/db/orders";
import { createReturn } from "../../lib/db/returns";
import {
  created,
  badRequest,
  notFound,
  forbidden,
  unauthorized,
  serverError,
} from "../../lib/utils/response";
import type { ReturnItem } from "../../types/return";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const input = JSON.parse(event.body);

    if (!input.orderId) {
      return badRequest("Order ID is required");
    }

    if (!input.reason) {
      return badRequest("Reason is required");
    }

    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      return badRequest("Items array must be non-empty");
    }

    const order = await getOrderById(input.orderId);
    if (!order) {
      return notFound("Order not found");
    }

    if (order.userId !== user.userId) {
      return forbidden("Order does not belong to you");
    }

    if (order.status !== "delivered" && order.status !== "completed") {
      return badRequest("Order must be delivered or completed to request a return");
    }

    const returnItems: ReturnItem[] = input.items.map(
      (item: { productId: string; variantId?: string; quantity: number }) => {
        const orderItem = order.items.find(
          (oi) =>
            oi.productId === item.productId &&
            oi.variantId === item.variantId
        );
        return {
          productId: item.productId,
          variantId: item.variantId,
          name: orderItem?.name || "",
          sku: orderItem?.sku || "",
          quantity: item.quantity,
          price: orderItem?.price || 0,
        };
      }
    );

    const returnItem = await createReturn({
      orderId: input.orderId,
      userId: user.userId,
      items: returnItems,
      reason: input.reason,
      images: input.images,
      status: "requested",
    });

    return created({ return: returnItem });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error creating return:", error);
    return serverError();
  }
}
