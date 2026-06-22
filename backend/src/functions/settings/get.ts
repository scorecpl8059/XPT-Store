import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { getAllSettings } from "../../lib/db/settings";
import { success, unauthorized, forbidden, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const settings = await getAllSettings();

    return success({ settings });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Get settings error:", err);
    return serverError();
  }
}
