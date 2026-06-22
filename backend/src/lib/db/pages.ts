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
import type { Page, CreatePageInput } from "../../types/page";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createPage(input: CreatePageInput): Promise<Page> {
  const now = new Date().toISOString();
  const page: Page = {
    pageId: generateId(),
    title: input.title,
    slug: input.slug || generateSlug(input.title),
    content: input.content,
    type: input.type,
    sortOrder: input.sortOrder || 0,
    status: input.status || "draft",
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.PAGES,
      Item: page,
    })
  );

  return page;
}

export async function getPageById(pageId: string): Promise<Page | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.PAGES,
      Key: { pageId },
    })
  );
  return (result.Item as Page) || null;
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.PAGES,
      IndexName: "slug-index",
      KeyConditionExpression: "slug = :slug",
      ExpressionAttributeValues: { ":slug": slug },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as Page) || null;
}

export async function listPagesByType(type: string): Promise<Page[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.PAGES,
      IndexName: "type-sortOrder-index",
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: { "#type": "type" },
      ExpressionAttributeValues: { ":type": type },
    })
  );
  return (result.Items as Page[]) || [];
}

export async function updatePage(
  pageId: string,
  updates: Partial<Omit<Page, "pageId" | "createdAt">>
): Promise<Page | null> {
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

  if (expressions.length === 0) return getPageById(pageId);

  expressions.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.PAGES,
      Key: { pageId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Page) || null;
}

export async function deletePage(pageId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.PAGES,
      Key: { pageId },
    })
  );
}
