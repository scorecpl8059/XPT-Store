import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { createPage } from "../../lib/db/pages";
import { created, badRequest, unauthorized, forbidden, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { title, slug, content, type, sortOrder, status, seoTitle, seoDescription } =
      JSON.parse(event.body);

    if (!title || !content) {
      return badRequest("Title and content are required");
    }

    if (!type || !["legal", "faq", "custom"].includes(type)) {
      return badRequest("Type must be 'legal', 'faq', or 'custom'");
    }

    const page = await createPage({
      title,
      slug,
      content,
      type,
      sortOrder,
      status,
      seoTitle,
      seoDescription,
    });

    return created({ page });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Create page error:", err);
    return serverError();
  }
}
