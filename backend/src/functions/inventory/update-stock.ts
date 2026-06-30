import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { getVariantsByProduct, updateStock } from "../../lib/db/variants";
import { logInventoryChange } from "../../lib/db/inventory";
import { success, badRequest, notFound, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAdmin(event);

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { productId, variantId, adjustment, reason } = JSON.parse(event.body);

    if (!productId) {
      return badRequest("productId is required");
    }

    if (typeof adjustment !== "number" || adjustment === 0) {
      return badRequest("adjustment must be a non-zero number");
    }

    const variants = await getVariantsByProduct(productId);

    if (variantId) {
      const variant = variants.find((v) => v.variantId === variantId);
      if (!variant) {
        return notFound("Variant not found");
      }

      const previousStock = variant.stock;
      const updated = await updateStock(productId, variantId, adjustment);

      if (!updated) {
        return badRequest("Stock update failed — resulting stock would be negative");
      }

      await logInventoryChange({
        productVariantKey: `${productId}#${variantId}`,
        type: "adjustment",
        quantityChange: adjustment,
        previousStock,
        newStock: updated.stock,
        reason,
        userId: user.userId,
      });

      return success({ stock: updated.stock });
    }

    // If no variantId, update the first variant (or return error if none)
    if (variants.length === 0) {
      return notFound("No variants found for this product");
    }

    const firstVariant = variants[0];
    const previousStock = firstVariant.stock;
    const updated = await updateStock(productId, firstVariant.variantId, adjustment);

    if (!updated) {
      return badRequest("Stock update failed — resulting stock would be negative");
    }

    await logInventoryChange({
      productVariantKey: `${productId}#${firstVariant.variantId}`,
      type: "adjustment",
      quantityChange: adjustment,
      previousStock,
      newStock: updated.stock,
      reason,
      userId: user.userId,
    });

    return success({ stock: updated.stock });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Update stock error:", err);
    return serverError();
  }
}
