import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getVariantsByProduct } from "../../lib/db/variants";
import { success, badRequest, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) return badRequest("Product ID is required");

    const variants = await getVariantsByProduct(productId);
    return success({ variants });
  } catch (err) {
    console.error("List variants error:", err);
    return serverError();
  }
}
