import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getAddresses } from "../../lib/db/addresses";
import { success, unauthorized, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    const addresses = await getAddresses(user.userId);

    return success(addresses);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("List addresses error:", err);
    return serverError();
  }
}
