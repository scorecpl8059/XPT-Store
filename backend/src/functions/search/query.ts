import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { searchProducts } from "../../lib/aws/opensearch";
import { logSearch } from "../../lib/db/search-logs";
import { getAuthUser } from "../../lib/auth/middleware";
import { success, badRequest, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const q = event.queryStringParameters?.q?.trim();
    if (!q) {
      return badRequest("Search query is required");
    }

    const categoryId = event.queryStringParameters?.categoryId;
    const minPrice = event.queryStringParameters?.minPrice
      ? parseFloat(event.queryStringParameters.minPrice)
      : undefined;
    const maxPrice = event.queryStringParameters?.maxPrice
      ? parseFloat(event.queryStringParameters.maxPrice)
      : undefined;
    const page = event.queryStringParameters?.page
      ? parseInt(event.queryStringParameters.page, 10)
      : 1;
    const size = event.queryStringParameters?.size
      ? parseInt(event.queryStringParameters.size, 10)
      : 20;

    const result = await searchProducts({
      query: q,
      categoryId,
      minPrice,
      maxPrice,
      from: (page - 1) * size,
      size,
    });

    // Log the search (non-blocking)
    const user = getAuthUser(event);
    logSearch({
      query: q,
      resultCount: result.total,
      userId: user?.userId,
    }).catch(() => {});

    return success({
      items: result.hits,
      total: result.total,
      page,
      size,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return serverError();
  }
}
