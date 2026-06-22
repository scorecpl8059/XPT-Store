import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateZone } from "../../lib/db/shipping";
import {
  success,
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

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { name, states, rates } = JSON.parse(event.body);

    const zone = await updateZone(id, { name, states, rates });

    return success({ zone });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error updating shipping zone:", error);
    return serverError();
  }
}
