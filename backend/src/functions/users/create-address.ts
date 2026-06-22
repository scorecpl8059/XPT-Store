import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { createAddress } from "../../lib/db/addresses";
import { created, badRequest, unauthorized, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const body = JSON.parse(event.body || "{}");

    if (!body.recipientName || !body.street1) {
      return badRequest("recipientName and street1 are required");
    }

    const address = await createAddress(user.userId, body);

    return created(address);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Create address error:", err);
    return serverError();
  }
}
