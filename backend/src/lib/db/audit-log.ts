import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";

export interface AuditLogEntry {
  entityType: string; // "order", "product", "user", "return", "settings"
  timestampLogId: string; // ISO timestamp#logId (sort key)
  logId: string;
  action: string; // "status_change", "price_update", "refund", "role_change", etc.
  adminUserId: string;
  adminEmail: string;
  entityId: string; // the ID of the affected entity
  changes: Record<string, { from: unknown; to: unknown }>;
  ipAddress?: string;
  createdAt: string;
}

export async function createAuditLog(
  input: Omit<AuditLogEntry, "timestampLogId" | "logId" | "createdAt">
): Promise<AuditLogEntry> {
  const now = new Date().toISOString();
  const logId = generateId();

  const entry: AuditLogEntry = {
    ...input,
    timestampLogId: `${now}#${logId}`,
    logId,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.AUDIT_LOGS,
      Item: entry,
    })
  );

  return entry;
}

export async function getAuditLogsByEntity(
  entityType: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: AuditLogEntry[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.AUDIT_LOGS,
      KeyConditionExpression: "entityType = :entityType",
      ExpressionAttributeValues: { ":entityType": entityType },
      ScanIndexForward: false,
      Limit: options?.limit || 50,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as AuditLogEntry[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function getAuditLogsByAdmin(
  adminUserId: string,
  options?: { limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: AuditLogEntry[]; lastKey?: Record<string, unknown> }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.AUDIT_LOGS,
      IndexName: "adminUserId-createdAt-index",
      KeyConditionExpression: "adminUserId = :adminUserId",
      ExpressionAttributeValues: { ":adminUserId": adminUserId },
      ScanIndexForward: false,
      Limit: options?.limit || 50,
      ExclusiveStartKey: options?.lastKey,
    })
  );
  return {
    items: (result.Items as AuditLogEntry[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}
