import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getReviewsByProduct } from "../../lib/db/reviews";
import { success, badRequest, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return badRequest("Product ID is required");
    }

    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;
    const lastKey = event.queryStringParameters?.cursor
      ? JSON.parse(decodeURIComponent(event.queryStringParameters.cursor))
      : undefined;

    // Only return approved reviews for public listing
    const status = event.queryStringParameters?.status;
    const result = await getReviewsByProduct(productId, { limit, lastKey });

    // Filter to approved-only for non-admin requests
    const items = status
      ? result.items
      : result.items.filter((r) => r.status === "approved");

    return success({
      items,
      cursor: result.lastKey
        ? encodeURIComponent(JSON.stringify(result.lastKey))
        : undefined,
    });
  } catch (error) {
    console.error("Error listing reviews:", error);
    return serverError();
  }
}
