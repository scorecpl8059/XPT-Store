import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { updateUser } from "../../lib/db/users";
import { success, badRequest, unauthorized, serverError } from "../../lib/utils/response";

const ALLOWED_FIELDS = ["name", "phone", "companyName", "taxId", "preferredLanguage"] as const;

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const body = JSON.parse(event.body || "{}");

    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return badRequest("No valid fields to update");
    }

    const updated = await updateUser(user.userId, updates);
    if (!updated) {
      return badRequest("User not found");
    }

    const { passwordHash: _ph, totpSecret: _ts, ...safeProfile } = updated;

    return success(safeProfile);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(err.message);
    console.error("Update profile error:", err);
    return serverError();
  }
}
