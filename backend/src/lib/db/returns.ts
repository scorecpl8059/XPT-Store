import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";
import type { Return } from "../../types/return";

export async function createReturn(
  returnData: Omit<Return, "returnId" | "requestedAt" | "updatedAt">
): Promise<Return> {
  const now = new Date().toISOString();
  const returnItem: Return = {
    ...returnData,
    returnId: generateId(),
    requestedAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.RETURNS,
      Item: returnItem,
    })
  );

  return returnItem;
}

export async function getReturnById(
  returnId: string
): Promise<Return | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.RETURNS,
      Key: { returnId },
    })
  );
  return (result.Item as Return) || null;
}

export async function listReturnsByOrder(
  orderId: string
): Promise<Return[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.RETURNS,
      IndexName: "orderId-index",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": orderId },
    })
  );
  return (result.Items as Return[]) || [];
}

export async function listReturnsByUser(
  userId: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: Return[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.RETURNS,
      IndexName: "userId-requestedAt-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
      ScanIndexForward: false,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Return[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function listReturnsByStatus(
  status: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: Return[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.RETURNS,
      IndexName: "status-requestedAt-index",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
      ScanIndexForward: false,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Return[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function updateReturn(
  returnId: string,
  updates: Partial<
    Pick<Return, "status" | "refundAmount" | "adminNotes">
  >
): Promise<Return | null> {
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

  if (expressions.length === 0) return getReturnById(returnId);

  expressions.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.RETURNS,
      Key: { returnId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Return) || null;
}
