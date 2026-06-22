import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateReturn } from "../../lib/db/returns";
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
      return badRequest("Return ID is required");
    }

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { status, refundAmount, adminNotes } = JSON.parse(event.body);

    const updated = await updateReturn(id, { status, refundAmount, adminNotes });
    if (!updated) {
      return notFound("Return not found");
    }

    return success({ return: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error updating return:", error);
    return serverError();
  }
}
