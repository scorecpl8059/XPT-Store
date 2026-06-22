import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";
import type { Rfq } from "../../types/rfq";

export async function createRfq(
  rfqData: Omit<Rfq, "rfqId" | "status" | "createdAt" | "updatedAt">
): Promise<Rfq> {
  const now = new Date().toISOString();
  const rfq: Rfq = {
    ...rfqData,
    rfqId: generateId(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.RFQ,
      Item: rfq,
    })
  );

  return rfq;
}

export async function getRfqById(rfqId: string): Promise<Rfq | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.RFQ,
      Key: { rfqId },
    })
  );
  return (result.Item as Rfq) || null;
}

export async function listRfqsByUser(
  userId: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: Rfq[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.RFQ,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
      ScanIndexForward: false,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Rfq[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function listRfqsByStatus(
  status: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: Rfq[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.RFQ,
      IndexName: "status-createdAt-index",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
      ScanIndexForward: false,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Rfq[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function updateRfqStatus(
  rfqId: string,
  status: Rfq["status"]
): Promise<Rfq | null> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.RFQ,
      Key: { rfqId },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Rfq) || null;
}
