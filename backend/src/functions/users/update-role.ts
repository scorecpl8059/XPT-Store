import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateUser } from "../../lib/db/users";
import { success, badRequest, unauthorized, forbidden, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("User ID is required");
    }

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { role } = JSON.parse(event.body);

    if (role !== "admin" && role !== "customer") {
      return badRequest("Role must be 'admin' or 'customer'");
    }

    const user = await updateUser(id, { role });

    if (!user) {
      return badRequest("User not found");
    }

    const { passwordHash, totpSecret, ...safeUser } = user;

    return success({ user: safeUser });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Update role error:", err);
    return serverError();
  }
}
