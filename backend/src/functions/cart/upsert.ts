import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { saveCart } from "../../lib/db/cart";
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

    const body = JSON.parse(event.body || "{}");

    if (!Array.isArray(body.items)) {
      return badRequest("items array is required");
    }

    const cart = await saveCart({
      userId: user.userId,
      items: body.items,
      updatedAt: "",
    });

    return success({ cart });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error upserting cart:", error);
    return serverError();
  }
}
