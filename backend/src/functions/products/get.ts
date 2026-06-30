import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/db/client";
import { Tables } from "../../lib/db/tables";
import { success, notFound, badRequest, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const productId = event.pathParameters?.id;
    const slug = event.queryStringParameters?.slug;

    if (!productId && !slug) {
      return badRequest("Product ID or slug is required");
    }

    let product;

    if (slug) {
      // Look up by slug via GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: Tables.PRODUCTS,
          IndexName: "slug-index",
          KeyConditionExpression: "slug = :slug",
          ExpressionAttributeValues: { ":slug": slug },
          Limit: 1,
        })
      );
      product = result.Items?.[0];
    } else {
      // Direct lookup by ID
      const result = await docClient.send(
        new GetCommand({
          TableName: Tables.PRODUCTS,
          Key: { productId },
        })
      );
      product = result.Item;
    }

    if (!product) {
      return notFound("Product not found");
    }

    // Fetch variants if product has them
    let variants: Record<string, unknown>[] = [];
    if (product.hasVariants) {
      const variantResult = await docClient.send(
        new QueryCommand({
          TableName: Tables.VARIANTS,
          KeyConditionExpression: "productId = :pid",
          ExpressionAttributeValues: { ":pid": product.productId },
        })
      );
      variants = variantResult.Items || [];
    }

    return success({ ...product, variants });
  } catch (error) {
    console.error("Error getting product:", error);
    return serverError();
  }
}
