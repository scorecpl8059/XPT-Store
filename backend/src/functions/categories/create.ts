import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { createCategory } from "../../lib/db/categories";
import { createAuditLog } from "../../lib/db/audit-log";
import { createCategorySchema } from "../../lib/utils/validation";
import { created, badRequest, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const admin = requireAdmin(event);

    const body = JSON.parse(event.body || "{}");
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const category = await createCategory(parsed.data);

    await createAuditLog({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: "category.create",
      entityType: "category",
      entityId: category.categoryId,
      changes: { created: { from: null, to: category.name } },
    });

    return created({ category });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403
        ? forbidden(err.message)
        : unauthorized(err.message);
    }
    console.error("Create category error:", err);
    return serverError();
  }
}
