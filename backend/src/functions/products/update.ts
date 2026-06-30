import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateProduct, getProductById } from "../../lib/db/products";
import { createAuditLog } from "../../lib/db/audit-log";
import { success, badRequest, notFound, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  basePrice: z.number().positive().optional(),
  weight: z.number().nonnegative().optional(),
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .nullable()
    .optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  hasVariants: z.boolean().optional(),
  variantTypes: z
    .array(
      z.object({
        name: z.string().min(1),
        values: z.array(z.string().min(1)),
      })
    )
    .nullable()
    .optional(),
  relatedProductIds: z.array(z.string()).optional(),
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const admin = requireAdmin(event);

    const productId = event.pathParameters?.id;
    if (!productId) return badRequest("Product ID is required");

    const existing = await getProductById(productId);
    if (!existing) return notFound("Product not found");

    const body = JSON.parse(event.body || "{}");
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        updates[key] = value === null ? undefined : value;
      }
    }

    const product = await updateProduct(productId, updates);

    await createAuditLog({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: "product.update",
      entityType: "product",
      entityId: productId,
      changes: Object.fromEntries(
        Object.entries(parsed.data).map(([key, value]) => [
          key,
          { from: (existing as unknown as Record<string, unknown>)[key], to: value },
        ])
      ),
    });

    return success({ product });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403
        ? forbidden(err.message)
        : unauthorized(err.message);
    }
    console.error("Update product error:", err);
    return serverError();
  }
}
