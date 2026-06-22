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
import type { Product, CreateProductInput } from "../../types/product";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createProduct(
  input: CreateProductInput
): Promise<Product> {
  const now = new Date().toISOString();
  const product: Product = {
    productId: generateId(),
    name: input.name,
    slug: input.slug || generateSlug(input.name),
    description: input.description,
    categoryId: input.categoryId,
    basePrice: input.basePrice,
    weight: input.weight,
    dimensions: input.dimensions,
    images: input.images || [],
    status: input.status || "draft",
    hasVariants: input.hasVariants || false,
    variantTypes: input.variantTypes,
    relatedProductIds: input.relatedProductIds || [],
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    averageRating: 0,
    reviewCount: 0,
    totalSold: 0,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.PRODUCTS,
      Item: product,
    })
  );

  return product;
}

export async function getProductById(
  productId: string
): Promise<Product | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.PRODUCTS,
      Key: { productId },
    })
  );
  return (result.Item as Product) || null;
}

export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.PRODUCTS,
      IndexName: "slug-index",
      KeyConditionExpression: "slug = :slug",
      ExpressionAttributeValues: { ":slug": slug },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as Product) || null;
}

export async function listProducts(options?: {
  categoryId?: string;
  status?: string;
  limit?: number;
  lastKey?: Record<string, unknown>;
}): Promise<{ items: Product[]; lastKey?: Record<string, unknown> }> {
  if (options?.categoryId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: Tables.PRODUCTS,
        IndexName: "categoryId-createdAt-index",
        KeyConditionExpression: "categoryId = :categoryId",
        ExpressionAttributeValues: { ":categoryId": options.categoryId },
        ScanIndexForward: false,
        Limit: options?.limit || 20,
        ExclusiveStartKey: options?.lastKey,
      })
    );
    return {
      items: (result.Items as Product[]) || [],
      lastKey: result.LastEvaluatedKey,
    };
  }

  if (options?.status) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: Tables.PRODUCTS,
        IndexName: "status-createdAt-index",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": options.status },
        ScanIndexForward: false,
        Limit: options?.limit || 20,
        ExclusiveStartKey: options?.lastKey,
      })
    );
    return {
      items: (result.Items as Product[]) || [],
      lastKey: result.LastEvaluatedKey,
    };
  }

  // Default: list active products
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.PRODUCTS,
      IndexName: "status-createdAt-index",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": "active" },
      ScanIndexForward: false,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Product[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "productId" | "createdAt">>
): Promise<Product | null> {
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

  if (expressions.length === 0) return getProductById(productId);

  expressions.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.PRODUCTS,
      Key: { productId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Product) || null;
}

export async function deleteProduct(productId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.PRODUCTS,
      Key: { productId },
    })
  );
}
