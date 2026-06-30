import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateVariant } from "../../lib/db/variants";
import { success, badRequest, notFound, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";
import { z } from "zod";

const updateVariantSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  image: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    requireAdmin(event);

    const productId = event.pathParameters?.id;
    const variantId = event.pathParameters?.variantId;
    if (!productId || !variantId) {
      return badRequest("Product ID and Variant ID are required");
    }

    const body = JSON.parse(event.body || "{}");
    const parsed = updateVariantSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        updates[key] = value === null ? undefined : value;
      }
    }

    const variant = await updateVariant(productId, variantId, updates);
    if (!variant) return notFound("Variant not found");

    return success({ variant });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403
        ? forbidden(err.message)
        : unauthorized(err.message);
    }
    console.error("Update variant error:", err);
    return serverError();
  }
}
