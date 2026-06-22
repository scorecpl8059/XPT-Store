import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";

export interface SearchLog {
  date: string; // YYYY-MM-DD
  timestampSearchId: string; // ISO timestamp#searchId
  query: string;
  resultCount: number;
  userId?: string;
}

export async function logSearch(input: {
  query: string;
  resultCount: number;
  userId?: string;
}): Promise<void> {
  const now = new Date();
  const searchId = generateId();
  const log: SearchLog = {
    date: now.toISOString().slice(0, 10),
    timestampSearchId: `${now.toISOString()}#${searchId}`,
    query: input.query,
    resultCount: input.resultCount,
    userId: input.userId,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.SEARCH_LOGS,
      Item: log,
    })
  );
}

export async function getSearchLogs(
  date: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: SearchLog[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.SEARCH_LOGS,
      KeyConditionExpression: "#date = :date",
      ExpressionAttributeNames: { "#date": "date" },
      ExpressionAttributeValues: { ":date": date },
      ScanIndexForward: false,
      Limit: options?.limit || 100,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as SearchLog[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}
