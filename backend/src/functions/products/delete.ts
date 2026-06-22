import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { deleteProduct, getProductById } from "../../lib/db/products";
import { getVariantsByProduct, deleteVariant } from "../../lib/db/variants";
import { createAuditLog } from "../../lib/db/audit-log";
import { noContent, badRequest, notFound, unauthorized, forbidden, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const admin = requireAdmin(event);

    const productId = event.pathParameters?.id;
    if (!productId) return badRequest("Product ID is required");

    const existing = await getProductById(productId);
    if (!existing) return notFound("Product not found");

    // Delete all variants first
    const variants = await getVariantsByProduct(productId);
    for (const variant of variants) {
      await deleteVariant(productId, variant.variantId);
    }

    await deleteProduct(productId);

    await createAuditLog({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: "product.delete",
      entityType: "product",
      entityId: productId,
      changes: { deleted: { from: existing.name, to: null } },
    });

    return noContent();
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403
        ? forbidden(err.message)
        : unauthorized(err.message);
    }
    console.error("Delete product error:", err);
    return serverError();
  }
}
