import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getAuthUser } from "../../lib/auth/middleware";
import { listPagesByType } from "../../lib/db/pages";
import { success, badRequest, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = getAuthUser(event);
    const isAdmin = user?.role === "admin";

    const type = event.queryStringParameters?.type;

    if (!type) {
      return badRequest("Query parameter 'type' is required (legal, faq, or custom)");
    }

    let pages = await listPagesByType(type);

    // Non-admin users can only see published pages
    if (!isAdmin) {
      pages = pages.filter((page) => page.status === "published");
    }

    return success({ pages });
  } catch (err) {
    console.error("List pages error:", err);
    return serverError();
  }
}
