import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { removeFromWishlist } from "../../lib/db/wishlists";
import { noContent, badRequest, unauthorized, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const productId = event.pathParameters?.productId;
    if (!productId) return badRequest("Product ID is required");

    await removeFromWishlist(user.userId, productId);

    return noContent();
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Remove from wishlist error:", err);
    return serverError();
  }
}
