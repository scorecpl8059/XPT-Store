/**
 * Seed script: creates an admin user in xpt_store_users.
 *
 * Usage:  npx tsx scripts/seed-admin.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = "xpt_store_users";

const ADMIN_EMAIL = "admin@xpt-tech.com";
const ADMIN_PASSWORD = "Admin@2026!";
const ADMIN_NAME = "XPT Admin";

async function seed() {
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = {
    userId: ulid(),
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    passwordHash,
    role: "admin",
    accountType: "individual",
    authProvider: "email",
    totpEnabled: false,
    preferredLanguage: "en",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: user,
    })
  );

  console.log("Admin user created:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Role:     admin`);
  console.log(`  UserId:   ${user.userId}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
