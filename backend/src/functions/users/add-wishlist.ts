import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { addToWishlist } from "../../lib/db/wishlists";
import { created, badRequest, unauthorized, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const body = JSON.parse(event.body || "{}");

    if (!body.productId) {
      return badRequest("productId is required");
    }

    await addToWishlist(user.userId, body.productId);

    return created({ productId: body.productId });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Add to wishlist error:", err);
    return serverError();
  }
}
