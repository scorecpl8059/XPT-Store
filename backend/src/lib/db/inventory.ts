import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";

export interface InventoryLog {
  productVariantKey: string; // productId#variantId
  timestamp: string;
  logId: string;
  type: "adjustment" | "sale" | "return" | "restock";
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  userId?: string; // admin who made the change
}

export async function logInventoryChange(
  input: Omit<InventoryLog, "timestamp" | "logId">
): Promise<InventoryLog> {
  const logId = generateId();
  const timestamp = `${new Date().toISOString()}#${logId}`;

  const log: InventoryLog = {
    ...input,
    timestamp,
    logId,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.INVENTORY_LOGS,
      Item: log,
    })
  );

  return log;
}

export async function getInventoryHistory(
  productId: string,
  variantId: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: InventoryLog[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.INVENTORY_LOGS,
      KeyConditionExpression: "productVariantKey = :key",
      ExpressionAttributeValues: {
        ":key": `${productId}#${variantId}`,
      },
      ScanIndexForward: false,
      Limit: options?.limit || 50,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as InventoryLog[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}
