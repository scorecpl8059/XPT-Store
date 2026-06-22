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
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("List orders error:", err);
    return serverError();
  }
}
