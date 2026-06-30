import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getAuthUser } from "../../lib/auth/middleware";
import { getPageBySlug } from "../../lib/db/pages";
import { success, badRequest, notFound, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = getAuthUser(event);
    const isAdmin = user?.role === "admin";

    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("Page ID or slug is required");
    }

    const page = await getPageBySlug(id);
    if (!page) {
      return notFound("Page not found");
    }

    // Non-admin users cannot see draft pages
    if (!isAdmin && page.status === "draft") {
      return notFound("Page not found");
    }

    return success({ page });
  } catch (err) {
    console.error("Get page error:", err);
    return serverError();
  }
}
