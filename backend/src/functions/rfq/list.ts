import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { listRfqsByUser, listRfqsByStatus } from "../../lib/db/rfq";
import { success, unauthorized, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    if (user.role === "admin") {
      const status = event.queryStringParameters?.status || "pending";
      const result = await listRfqsByStatus(status);
      return success({ rfqs: result.items });
    }

    const result = await listRfqsByUser(user.userId);
    return success({ rfqs: result.items });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("List RFQs error:", err);
    return serverError();
  }
}
