import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import type { Cart } from "../../types/cart";

export async function getCart(userId: string): Promise<Cart | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.CART,
      Key: { userId },
    })
  );
  return (result.Item as Cart) || null;
}

export async function saveCart(cart: Cart): Promise<Cart> {
  cart.updatedAt = new Date().toISOString();
  await docClient.send(
    new PutCommand({
      TableName: Tables.CART,
      Item: cart,
    })
  );
  return cart;
}

export async function clearCart(userId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.CART,
      Key: { userId },
    })
  );
}
