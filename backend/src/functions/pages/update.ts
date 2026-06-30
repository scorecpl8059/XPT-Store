import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updatePage } from "../../lib/db/pages";
import { success, badRequest, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

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

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { title, slug, content, type, sortOrder, status, seoTitle, seoDescription } =
      JSON.parse(event.body);

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = slug;
    if (content !== undefined) updates.content = content;
    if (type !== undefined) updates.type = type;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (status !== undefined) updates.status = status;
    if (seoTitle !== undefined) updates.seoTitle = seoTitle;
    if (seoDescription !== undefined) updates.seoDescription = seoDescription;

    const page = await updatePage(id, updates);

    return success({ page });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Update page error:", err);
    return serverError();
  }
}
