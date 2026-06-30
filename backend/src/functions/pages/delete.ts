import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { deletePage } from "../../lib/db/pages";
import { noContent, badRequest, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    requireAdmin(event);

    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("Page ID is required");
    }

    await deletePage(id);

    return noContent();
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Delete page error:", err);
    return serverError();
  }
}
