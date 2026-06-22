import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getReturnById } from "../../lib/db/returns";
import {
  success,
  badRequest,
  notFound,
  forbidden,
  unauthorized,
  serverError,
} from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("Return ID is required");
    }

    const returnItem = await getReturnById(id);
    if (!returnItem) {
      return notFound("Return not found");
    }

    if (user.role !== "admin" && returnItem.userId !== user.userId) {
      return forbidden("Return does not belong to you");
    }

    return success({ return: returnItem });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error getting return:", error);
    return serverError();
  }
}
