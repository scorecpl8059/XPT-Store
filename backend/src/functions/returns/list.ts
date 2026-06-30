import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { listReturnsByStatus, listReturnsByUser } from "../../lib/db/returns";
import { success, unauthorized, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    const status = event.queryStringParameters?.status;

    if (user.role === "admin") {
      const result = await listReturnsByStatus(status || "requested");
      return success({ returns: result.items });
    }

    const result = await listReturnsByUser(user.userId);
    return success({ returns: result.items });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error listing returns:", error);
    return serverError();
  }
}
