import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { deleteAddress } from "../../lib/db/addresses";
import { noContent, badRequest, unauthorized, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const addressId = event.pathParameters?.addressId;
    if (!addressId) return badRequest("Address ID is required");

    await deleteAddress(user.userId, addressId);

    return noContent();
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Delete address error:", err);
    return serverError();
  }
}
