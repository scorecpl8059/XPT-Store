import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { deleteZone } from "../../lib/db/shipping";
import {
  noContent,
  badRequest,
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
      return badRequest("Zone ID is required");
    }

    await deleteZone(id);

    return noContent();
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error deleting shipping zone:", error);
    return serverError();
  }
}
