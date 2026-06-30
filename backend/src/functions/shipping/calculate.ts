import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getProductById } from "../../lib/db/products";
import { getVariantsByProduct } from "../../lib/db/variants";
import { calculateShippingRate } from "../../lib/db/shipping";
import { success, badRequest, serverError, initCors } from "../../lib/utils/response";

interface CalculateShippingInput {
  state: string;
  items: { productId: string; variantId?: string; quantity: number }[];
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    if (!event.body) {
      return badRequest("Request body is required");
    }

    const input: CalculateShippingInput = JSON.parse(event.body);

    if (!input.state) {
      return badRequest("State is required");
    }

    if (!input.items || input.items.length === 0) {
      return badRequest("Items array is required");
    }

    // Calculate total weight from products/variants
    let totalWeight = 0;

    for (const item of input.items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return badRequest(`Product not found: ${item.productId}`);
      }

      let weight = product.weight || 0.5;

      if (item.variantId) {
        const variants = await getVariantsByProduct(item.productId);
        const variant = variants.find((v) => v.variantId === item.variantId);
        if (variant) {
          weight = variant.weight || weight;
        }
      }

      totalWeight += weight * item.quantity;
    }

    const result = await calculateShippingRate(input.state, totalWeight);

    if (!result) {
      return success({ shippingCost: 0, zone: "Free shipping" });
    }

    return success({
      shippingCost: result.rate.price,
      zone: result.zone.name,
    });
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return serverError();
  }
}
