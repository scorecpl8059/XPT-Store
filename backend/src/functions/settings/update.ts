import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { setSetting } from "../../lib/db/settings";
import { success, badRequest, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    requireAdmin(event);

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const body = JSON.parse(event.body);

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return badRequest("Body must be a key-value object");
    }

    for (const [key, value] of Object.entries(body)) {
      await setSetting(key, value);
    }

    return success({ settings: body });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Update settings error:", err);
    return serverError();
  }
}
