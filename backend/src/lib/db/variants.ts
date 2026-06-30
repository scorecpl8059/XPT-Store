import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";
import type { Variant, CreateVariantInput } from "../../types/product";

export async function createVariant(
  productId: string,
  input: CreateVariantInput
): Promise<Variant> {
  const variant: Variant = {
    productId,
    variantId: generateId(),
    sku: input.sku,
    attributes: input.attributes,
    price: input.price,
    stock: input.stock,
    reservedStock: 0,
    weight: input.weight,
    image: input.image,
    status: "active",
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.VARIANTS,
      Item: variant,
    })
  );

  return variant;
}

export async function getVariantsByProduct(
  productId: string
): Promise<Variant[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.VARIANTS,
      KeyConditionExpression: "productId = :productId",
      ExpressionAttributeValues: { ":productId": productId },
    })
  );
  return (result.Items as Variant[]) || [];
}

export async function getVariantBySku(sku: string): Promise<Variant | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.VARIANTS,
      IndexName: "sku-index",
      KeyConditionExpression: "sku = :sku",
      ExpressionAttributeValues: { ":sku": sku },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as Variant) || null;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  updates: Partial<Pick<Variant, "sku" | "attributes" | "price" | "stock" | "weight" | "image" | "status">>
): Promise<Variant | null> {
  const expressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      expressions.push(`#${key} = :${key}`);
      names[`#${key}`] = key;
      values[`:${key}`] = value;
    }
  });

  if (expressions.length === 0) return null;

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.VARIANTS,
      Key: { productId, variantId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Variant) || null;
}

export async function updateStock(
  productId: string,
  variantId: string,
  quantityChange: number
): Promise<Variant | null> {
  try {
    const values: Record<string, unknown> = { ":change": quantityChange };
    let condition: string | undefined;

    if (quantityChange < 0) {
      condition = "stock >= :minRequired";
      values[":minRequired"] = Math.abs(quantityChange);
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: Tables.VARIANTS,
        Key: { productId, variantId },
        UpdateExpression: "SET stock = stock + :change",
        ...(condition ? { ConditionExpression: condition } : {}),
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );
    return (result.Attributes as Variant) || null;
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    if (name === "ConditionalCheckFailedException") {
      return null;
    }
    throw err;
  }
}

export async function deleteVariant(
  productId: string,
  variantId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.VARIANTS,
      Key: { productId, variantId },
    })
  );
}
