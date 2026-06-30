import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { getZone } from "../../lib/db/shipping";
import {
  success,
  badRequest,
  notFound,
  unauthorized,
  serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    requireAdmin(event);

    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("Zone ID is required");
    }

    const zone = await getZone(id);
    if (!zone) {
      return notFound("Shipping zone not found");
    }

    return success({ zone });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error getting shipping zone:", error);
    return serverError();
  }
}
