import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";
import type { Order } from "../../types/order";

export async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

  // Query today's orders to get the next sequence number
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.ORDERS,
      IndexName: "status-createdAt-index",
      KeyConditionExpression:
        "#status = :status AND begins_with(createdAt, :today)",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "processing",
        ":today": date.toISOString().slice(0, 10),
      },
      Select: "COUNT",
    })
  );

  // Simple sequence - in production you'd want an atomic counter
  const seq = ((result.Count || 0) + 1).toString().padStart(4, "0");
  return `XPT-${dateStr}-${seq}`;
}

export async function createOrder(
  order: Omit<Order, "orderId" | "orderNumber" | "createdAt" | "updatedAt">
): Promise<Order> {
  const now = new Date().toISOString();
  const fullOrder: Order = {
    ...order,
    orderId: generateId(),
    orderNumber: await generateOrderNumber(),
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.ORDERS,
      Item: fullOrder,
    })
  );

  return fullOrder;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.ORDERS,
      Key: { orderId },
    })
  );
  return (result.Item as Order) || null;
}

export async function getOrderByNumber(
  orderNumber: string
): Promise<Order | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.ORDERS,
      IndexName: "orderNumber-index",
      KeyConditionExpression: "orderNumber = :orderNumber",
      ExpressionAttributeValues: { ":orderNumber": orderNumber },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as Order) || null;
}

export async function listOrdersByUser(
  userId: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: Order[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.ORDERS,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
      ScanIndexForward: false,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Order[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function listOrdersByStatus(
  status: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: Order[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.ORDERS,
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
    items: (result.Items as Order[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function listAllOrders(options?: {
  limit?: number;
  lastKey?: Record<string, unknown>;
}): Promise<{ items: Order[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: Tables.ORDERS,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Order[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function updateOrder(
  orderId: string,
  updates: Partial<
    Pick<
      Order,
      | "status"
      | "trackingNumber"
      | "carrier"
      | "estimatedDelivery"
      | "invoiceUrl"
      | "shippedAt"
      | "deliveredAt"
      | "paymentIntentId"
    >
  >
): Promise<Order | null> {
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

  if (expressions.length === 0) return getOrderById(orderId);

  expressions.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.ORDERS,
      Key: { orderId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Order) || null;
}
