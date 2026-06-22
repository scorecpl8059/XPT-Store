import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { listOrdersByUser } from "../../lib/db/orders";
import { success, unauthorized, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : undefined;

    const result = await listOrdersByUser(user.userId, { limit });

    return success(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error listing orders:", error);
    return serverError();
  }
}
