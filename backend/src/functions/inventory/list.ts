import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { listProducts } from "../../lib/db/products";
import { getVariantsByProduct } from "../../lib/db/variants";
import { success, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    requireAdmin(event);

    const lowStockOnly = event.queryStringParameters?.lowStock === "true";

    const result = await listProducts({ limit: 1000 });

    const inventory = [];

    for (const product of result.items) {
      const variants = await getVariantsByProduct(product.productId);

      const variantItems = variants.map((v) => ({
        variantId: v.variantId,
        sku: v.sku,
        stock: v.stock,
        lowStock: v.stock < 10,
      }));

      const productStock = variants.length > 0
        ? variants.reduce((sum, v) => sum + v.stock, 0)
        : (product.stock ?? 0);

      const item = {
        productId: product.productId,
        name: product.name,
        sku: product.slug,
        stock: productStock,
        lowStock: productStock < 10,
        variants: variantItems,
      };

      if (lowStockOnly) {
        const hasLowStock = item.lowStock || variantItems.some((v) => v.lowStock);
        if (hasLowStock) {
          inventory.push(item);
        }
      } else {
        inventory.push(item);
      }
    }

    return success({ inventory });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("List inventory error:", err);
    return serverError();
  }
}
