import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getUserById } from "../../lib/db/users";
import { getProductById } from "../../lib/db/products";
import { createRfq } from "../../lib/db/rfq";
import { created, badRequest, unauthorized, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const authUser = requireAuth(event);

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { items, message } = JSON.parse(event.body);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return badRequest("Items array is required and must not be empty");
    }

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return badRequest("Each item must have productId and quantity");
      }
    }

    const fullUser = await getUserById(authUser.userId);

    const enrichedItems = [];
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return badRequest(`Product not found: ${item.productId}`);
      }
      enrichedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: product.name,
        sku: product.slug,
        quantity: item.quantity,
      });
    }

    const rfq = await createRfq({
      userId: authUser.userId,
      companyName: fullUser?.companyName,
      items: enrichedItems,
      message,
    });

    return created({ rfq });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Create RFQ error:", err);
    return serverError();
  }
}
