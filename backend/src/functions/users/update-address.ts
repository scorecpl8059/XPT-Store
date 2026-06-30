import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { updateAddress } from "../../lib/db/addresses";
import { success, badRequest, unauthorized, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    const addressId = event.pathParameters?.addressId;
    if (!addressId) return badRequest("Address ID is required");

    const body = JSON.parse(event.body || "{}");

    const address = await updateAddress(user.userId, addressId, body);

    return success(address);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Update address error:", err);
    return serverError();
  }
}
