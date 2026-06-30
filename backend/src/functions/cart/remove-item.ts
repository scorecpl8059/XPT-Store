import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getCart, saveCart } from "../../lib/db/cart";
import {
  success,
  badRequest,
  unauthorized,
  serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    const productId = event.pathParameters?.productId;
    if (!productId) {
      return badRequest("productId path parameter is required");
    }

    const variantId = event.queryStringParameters?.variantId;

    const existing = await getCart(user.userId);
    const items = (existing?.items ?? []).filter(
      (i) => !(i.productId === productId && i.variantId === variantId)
    );

    const cart = await saveCart({
      userId: user.userId,
      items,
      updatedAt: "",
    });

    return success({ cart });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error removing cart item:", error);
    return serverError();
  }
}
