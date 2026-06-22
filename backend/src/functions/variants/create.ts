import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { getProductById } from "../../lib/db/products";
import { createVariant, getVariantBySku } from "../../lib/db/variants";
import { createVariantSchema } from "../../lib/utils/validation";
import { created, badRequest, notFound, unauthorized, forbidden, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const productId = event.pathParameters?.id;
    if (!productId) return badRequest("Product ID is required");

    const product = await getProductById(productId);
    if (!product) return notFound("Product not found");

    const body = JSON.parse(event.body || "{}");
    const parsed = createVariantSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    // Check SKU uniqueness
    const existingSku = await getVariantBySku(parsed.data.sku);
    if (existingSku) {
      return badRequest(`SKU "${parsed.data.sku}" is already in use`);
    }

    const variant = await createVariant(productId, parsed.data);
    return created({ variant });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403
        ? forbidden(err.message)
        : unauthorized(err.message);
    }
    console.error("Create variant error:", err);
    return serverError();
  }
}
