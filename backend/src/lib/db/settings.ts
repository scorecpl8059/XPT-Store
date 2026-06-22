import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";

export async function getSetting(
  settingKey: string
): Promise<unknown | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.SETTINGS,
      Key: { settingKey },
    })
  );
  return result.Item?.value ?? null;
}

export async function setSetting(
  settingKey: string,
  value: unknown
): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: Tables.SETTINGS,
      Item: {
        settingKey,
        value,
        updatedAt: new Date().toISOString(),
      },
    })
  );
}

export async function getAllSettings(): Promise<
  Record<string, unknown>
> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: Tables.SETTINGS,
    })
  );

  const settings: Record<string, unknown> = {};
  for (const item of result.Items || []) {
    settings[item.settingKey as string] = item.value;
  }
  return settings;
}
