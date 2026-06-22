import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { listAllOrders, listOrdersByStatus } from "../../lib/db/orders";
import { success, unauthorized, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const status = event.queryStringParameters?.status;
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : undefined;

    const result = status
      ? await listOrdersByStatus(status, { limit })
      : await listAllOrders({ limit });

    return success({ orders: result.items });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error listing orders (admin):", error);
    return serverError();
  }
}
