import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../db/client";
import { Tables } from "../db/tables";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface RateLimitRecord {
  settingKey: string; // reuse settings table: "rate_limit#<key>"
  attempts: number;
  lockedUntil?: string;
  updatedAt: string;
}

/**
 * Check if an action is rate-limited.
 * Uses store_settings table with a "rate_limit#" prefix key.
 */
export async function checkRateLimit(
  key: string // e.g., IP address or email
): Promise<{ allowed: boolean; remainingAttempts: number; lockedUntil?: string }> {
  const settingKey = `rate_limit#${key}`;

  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.SETTINGS,
      Key: { settingKey },
    })
  );

  const record = result.Item as RateLimitRecord | undefined;

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if lockout has expired
  if (record.lockedUntil) {
    if (new Date(record.lockedUntil) > new Date()) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: record.lockedUntil,
      };
    }
    // Lockout expired — reset
    await resetRateLimit(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = MAX_ATTEMPTS - record.attempts;
  return { allowed: remaining > 0, remainingAttempts: Math.max(0, remaining) };
}

/**
 * Record a failed attempt. Returns whether the account is now locked.
 */
export async function recordFailedAttempt(key: string): Promise<boolean> {
  const settingKey = `rate_limit#${key}`;

  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.SETTINGS,
      Key: { settingKey },
    })
  );

  const record = result.Item as RateLimitRecord | undefined;
  const attempts = (record?.attempts || 0) + 1;
  const now = new Date();

  const update: RateLimitRecord = {
    settingKey,
    attempts,
    updatedAt: now.toISOString(),
  };

  if (attempts >= MAX_ATTEMPTS) {
    const lockUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
    update.lockedUntil = lockUntil.toISOString();
  }

  await docClient.send(
    new PutCommand({
      TableName: Tables.SETTINGS,
      Item: update,
    })
  );

  return attempts >= MAX_ATTEMPTS;
}

/**
 * Reset rate limit after successful login.
 */
export async function resetRateLimit(key: string): Promise<void> {
  const settingKey = `rate_limit#${key}`;
  await docClient.send(
    new PutCommand({
      TableName: Tables.SETTINGS,
      Item: {
        settingKey,
        attempts: 0,
        updatedAt: new Date().toISOString(),
      },
    })
  );
}
