import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getCategoryById, getCategoryBySlug } from "../../lib/db/categories";
import { success, notFound, badRequest, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Category ID is required");

    // Support lookup by slug via query param ?by=slug
    const by = event.queryStringParameters?.by;
    const category =
      by === "slug"
        ? await getCategoryBySlug(id)
        : await getCategoryById(id);

    if (!category) return notFound("Category not found");

    return success({ category });
  } catch (err) {
    console.error("Get category error:", err);
    return serverError();
  }
}
