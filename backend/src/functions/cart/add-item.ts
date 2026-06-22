import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getCart, saveCart } from "../../lib/db/cart";
import type { CartItem } from "../../types/cart";
import {
  success,
  badRequest,
  unauthorized,
  serverError,
} from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const body = JSON.parse(event.body || "{}");
    const { productId, variantId, quantity } = body;

    if (!productId || typeof quantity !== "number" || quantity < 1) {
      return badRequest("productId and a positive quantity are required");
    }

    const existing = await getCart(user.userId);
    const items: CartItem[] = existing?.items ?? [];

    const idx = items.findIndex(
      (i) => i.productId === productId && i.variantId === variantId
    );

    if (idx >= 0) {
      items[idx].quantity += quantity;
    } else {
      items.push({
        productId,
        variantId,
        quantity,
        addedAt: new Date().toISOString(),
      });
    }

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
    console.error("Error adding cart item:", error);
    return serverError();
  }
}
