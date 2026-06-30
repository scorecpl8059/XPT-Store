import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getWishlist } from "../../lib/db/wishlists";
import { success, unauthorized, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    const items = await getWishlist(user.userId);

    return success(items);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Get wishlist error:", err);
    return serverError();
  }
}
