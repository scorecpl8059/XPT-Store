import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";
import type { Review, CreateReviewInput } from "../../types/review";

export async function createReview(
  userId: string,
  userName: string,
  input: CreateReviewInput
): Promise<Review> {
  const now = new Date().toISOString();
  const review: Review = {
    productId: input.productId,
    reviewId: generateId(),
    userId,
    userName,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    images: input.images,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.REVIEWS,
      Item: review,
    })
  );

  return review;
}

export async function getReviewsByProduct(
  productId: string,
  options?: {
    limit?: number;
    lastKey?: Record<string, unknown>;
  }
): Promise<{ items: Review[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.REVIEWS,
      KeyConditionExpression: "productId = :productId",
      ExpressionAttributeValues: { ":productId": productId },
      ScanIndexForward: false,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Review[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function getReviewsByUser(
  userId: string,
  options?: {
    limit?: number;
    lastKey?: Record<string, unknown>;
  }
): Promise<{ items: Review[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.REVIEWS,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
      ScanIndexForward: false,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as Review[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function listReviewsByStatus(
  status: string,
  options?: {
    limit?: number;
    lastKey?: Record<string, unknown>;
  }
): Promise<{ items: Review[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.REVIEWS,
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
    items: (result.Items as Review[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function updateReviewStatus(
  productId: string,
  reviewId: string,
  status: "approved" | "rejected"
): Promise<Review | null> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.REVIEWS,
      Key: { productId, reviewId },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Review) || null;
}
