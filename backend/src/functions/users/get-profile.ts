import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getUserById } from "../../lib/db/users";
import { success, notFound, unauthorized, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    const profile = await getUserById(user.userId);
    if (!profile) return notFound("User not found");

    const { passwordHash, totpSecret, ...safeProfile } = profile;

    return success(safeProfile);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Get profile error:", err);
    return serverError();
  }
}
