import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { listUsers } from "../../lib/db/users";
import { success, unauthorized, forbidden, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const role = event.queryStringParameters?.role;
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : undefined;

    const result = await listUsers({ role, limit });

    const users = result.items.map((user) => {
      const { passwordHash, totpSecret, ...safeUser } = user;
      return safeUser;
    });

    return success({ users });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("List users error:", err);
    return serverError();
  }
}
