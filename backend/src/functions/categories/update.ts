import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateCategory, getCategoryById } from "../../lib/db/categories";
import { createAuditLog } from "../../lib/db/audit-log";
import { success, badRequest, notFound, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const admin = requireAdmin(event);

    const categoryId = event.pathParameters?.id;
    if (!categoryId) return badRequest("Category ID is required");

    const existing = await getCategoryById(categoryId);
    if (!existing) return notFound("Category not found");

    const body = JSON.parse(event.body || "{}");
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    // Convert null to undefined for optional fields being cleared
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        updates[key] = value === null ? undefined : value;
      }
    }

    const category = await updateCategory(categoryId, updates);

    await createAuditLog({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: "category.update",
      entityType: "category",
      entityId: categoryId,
      changes: Object.fromEntries(
        Object.entries(parsed.data).map(([key, value]) => [
          key,
          { from: (existing as unknown as Record<string, unknown>)[key], to: value },
        ])
      ),
    });

    return success({ category });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403
        ? forbidden(err.message)
        : unauthorized(err.message);
    }
    console.error("Update category error:", err);
    return serverError();
  }
}
