import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";
import type { Category, CreateCategoryInput } from "../../types/category";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  const now = new Date().toISOString();
  const category: Category = {
    categoryId: generateId(),
    name: input.name,
    slug: input.slug || generateSlug(input.name),
    description: input.description,
    parentId: input.parentId,
    status: input.status || "active",
    productCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.CATEGORIES,
      Item: category,
    })
  );

  return category;
}

export async function getCategoryById(
  categoryId: string
): Promise<Category | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.CATEGORIES,
      Key: { categoryId },
    })
  );
  return (result.Item as Category) || null;
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.CATEGORIES,
      IndexName: "slug-index",
      KeyConditionExpression: "slug = :slug",
      ExpressionAttributeValues: { ":slug": slug },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as Category) || null;
}

export async function listChildCategories(
  parentId: string
): Promise<Category[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.CATEGORIES,
      IndexName: "parentId-sortOrder-index",
      KeyConditionExpression: "parentId = :parentId",
      ExpressionAttributeValues: { ":parentId": parentId },
    })
  );
  return (result.Items as Category[]) || [];
}

export async function listAllCategories(): Promise<Category[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: Tables.CATEGORIES,
    })
  );
  return (result.Items as Category[]) || [];
}

export async function updateCategory(
  categoryId: string,
  updates: Partial<Omit<Category, "categoryId" | "createdAt">>
): Promise<Category | null> {
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

  if (expressions.length === 0) return getCategoryById(categoryId);

  expressions.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.CATEGORIES,
      Key: { categoryId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Category) || null;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.CATEGORIES,
      Key: { categoryId },
    })
  );
}
