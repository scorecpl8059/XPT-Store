import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { listZones } from "../../lib/db/shipping";
import { success, unauthorized, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const zones = await listZones();

    return success({ zones });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error listing shipping zones:", error);
    return serverError();
  }
}
