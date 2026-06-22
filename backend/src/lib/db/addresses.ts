import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";
import type { Address, CreateAddressInput } from "../../types/user";

export async function createAddress(
  userId: string,
  input: CreateAddressInput
): Promise<Address> {
  const address: Address = {
    userId,
    addressId: generateId(),
    label: input.label,
    recipientName: input.recipientName,
    phone: input.phone,
    street1: input.street1,
    street2: input.street2,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
    country: input.country || "US",
    isDefault: input.isDefault || false,
  };

  // If setting as default, unset other defaults first
  if (address.isDefault) {
    await unsetDefaultAddresses(userId);
  }

  await docClient.send(
    new PutCommand({
      TableName: Tables.ADDRESSES,
      Item: address,
    })
  );

  return address;
}

export async function getAddresses(userId: string): Promise<Address[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.ADDRESSES,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    })
  );
  return (result.Items as Address[]) || [];
}

export async function updateAddress(
  userId: string,
  addressId: string,
  updates: Partial<Omit<Address, "userId" | "addressId">>
): Promise<Address | null> {
  if (updates.isDefault) {
    await unsetDefaultAddresses(userId);
  }

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

  if (expressions.length === 0) return null;

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.ADDRESSES,
      Key: { userId, addressId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as Address) || null;
}

export async function deleteAddress(
  userId: string,
  addressId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.ADDRESSES,
      Key: { userId, addressId },
    })
  );
}

export async function setDefaultAddress(
  userId: string,
  addressId: string
): Promise<void> {
  await unsetDefaultAddresses(userId);
  await docClient.send(
    new UpdateCommand({
      TableName: Tables.ADDRESSES,
      Key: { userId, addressId },
      UpdateExpression: "SET isDefault = :val",
      ExpressionAttributeValues: { ":val": true },
    })
  );
}

async function unsetDefaultAddresses(userId: string): Promise<void> {
  const addresses = await getAddresses(userId);
  const defaults = addresses.filter((a) => a.isDefault);
  for (const addr of defaults) {
    await docClient.send(
      new UpdateCommand({
        TableName: Tables.ADDRESSES,
        Key: { userId, addressId: addr.addressId },
        UpdateExpression: "SET isDefault = :val",
        ExpressionAttributeValues: { ":val": false },
      })
    );
  }
}
