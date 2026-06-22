import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { deleteCategory, getCategoryById, listChildCategories } from "../../lib/db/categories";
import { createAuditLog } from "../../lib/db/audit-log";
import { noContent, badRequest, notFound, unauthorized, forbidden, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const admin = requireAdmin(event);

    const categoryId = event.pathParameters?.id;
    if (!categoryId) return badRequest("Category ID is required");

    const existing = await getCategoryById(categoryId);
    if (!existing) return notFound("Category not found");

    // Prevent deletion if category has children
    const children = await listChildCategories(categoryId);
    if (children.length > 0) {
      return badRequest(
        "Cannot delete a category that has subcategories. Remove subcategories first."
      );
    }

    // Prevent deletion if category has products
    if (existing.productCount > 0) {
      return badRequest(
        "Cannot delete a category that contains products. Move or remove products first."
      );
    }

    await deleteCategory(categoryId);

    await createAuditLog({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: "category.delete",
      entityType: "category",
      entityId: categoryId,
      changes: { deleted: { from: existing.name, to: null } },
    });

    return noContent();
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403
        ? forbidden(err.message)
        : unauthorized(err.message);
    }
    console.error("Delete category error:", err);
    return serverError();
  }
}
