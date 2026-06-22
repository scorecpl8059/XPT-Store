import {
  PutCommand,
  DeleteCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";

export async function addToWishlist(
  userId: string,
  productId: string
): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: Tables.WISHLISTS,
      Item: {
        userId,
        productId,
        addedAt: new Date().toISOString(),
      },
    })
  );
}

export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.WISHLISTS,
      Key: { userId, productId },
    })
  );
}

export async function getWishlist(
  userId: string
): Promise<{ productId: string; addedAt: string }[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.WISHLISTS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    })
  );
  return (result.Items as { productId: string; addedAt: string }[]) || [];
}

export async function isInWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.WISHLISTS,
      Key: { userId, productId },
    })
  );
  return !!result.Item;
}
