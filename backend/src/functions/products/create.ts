import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { createProduct } from "../../lib/db/products";
import { createAuditLog } from "../../lib/db/audit-log";
import { createProductSchema } from "../../lib/utils/validation";
import { created, badRequest, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const admin = requireAdmin(event);

    const body = JSON.parse(event.body || "{}");
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const product = await createProduct(parsed.data);

    await createAuditLog({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: "product.create",
      entityType: "product",
      entityId: product.productId,
      changes: { created: { from: null, to: product.name } },
    });

    return created({ product });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403
        ? forbidden(err.message)
        : unauthorized(err.message);
    }
    console.error("Create product error:", err);
    return serverError();
  }
}
