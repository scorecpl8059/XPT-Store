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
import type { User, CreateUserInput } from "../../types/user";

export async function createUser(input: CreateUserInput): Promise<User> {
  const now = new Date().toISOString();
  const user: User = {
    userId: generateId(),
    email: input.email,
    name: input.name,
    passwordHash: undefined,
    role: "customer",
    accountType: input.accountType || "individual",
    companyName: input.companyName,
    taxId: input.taxId,
    phone: input.phone,
    authProvider: input.authProvider || "email",
    googleId: input.googleId,
    appleId: input.appleId,
    totpEnabled: false,
    preferredLanguage: "en",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.USERS,
      Item: user,
      ConditionExpression: "attribute_not_exists(userId)",
    })
  );

  return user;
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.USERS,
      Key: { userId },
    })
  );
  return (result.Item as User) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.USERS,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as User) || null;
}

export async function getUserByGoogleId(
  googleId: string
): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.USERS,
      IndexName: "googleId-index",
      KeyConditionExpression: "googleId = :googleId",
      ExpressionAttributeValues: { ":googleId": googleId },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as User) || null;
}

export async function getUserByAppleId(
  appleId: string
): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.USERS,
      IndexName: "appleId-index",
      KeyConditionExpression: "appleId = :appleId",
      ExpressionAttributeValues: { ":appleId": appleId },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as User) || null;
}

export async function updateUser(
  userId: string,
  updates: Partial<
    Pick<
      User,
      | "name"
      | "phone"
      | "avatar"
      | "companyName"
      | "taxId"
      | "preferredLanguage"
      | "status"
      | "role"
      | "passwordHash"
      | "totpSecret"
      | "totpEnabled"
    >
  >
): Promise<User | null> {
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

  if (expressions.length === 0) return getUserById(userId);

  expressions.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.USERS,
      Key: { userId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as User) || null;
}

export async function listUsers(options?: {
  role?: string;
  limit?: number;
  lastKey?: Record<string, unknown>;
}): Promise<{ items: User[]; lastKey?: Record<string, unknown> }> {
  if (options?.role) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: Tables.USERS,
        IndexName: "role-createdAt-index",
        KeyConditionExpression: "#role = :role",
        ExpressionAttributeNames: { "#role": "role" },
        ExpressionAttributeValues: { ":role": options.role },
        ScanIndexForward: false,
        Limit: options?.limit || 20,
        ExclusiveStartKey: options?.lastKey,
      })
    );
    return {
      items: (result.Items as User[]) || [],
      lastKey: result.LastEvaluatedKey,
    };
  }

  const result = await docClient.send(
    new ScanCommand({
      TableName: Tables.USERS,
      Limit: options?.limit || 20,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as User[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}
