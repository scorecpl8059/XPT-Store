/**
 * Create an admin user.
 * Usage: npx tsx scripts/create-admin.ts <email> <name> <password>
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

async function main() {
  const [, , email, name, password] = process.argv;

  if (!email || !name || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <name> <password>");
    process.exit(1);
  }

  // Check if email exists
  const existing = await docClient.send(
    new QueryCommand({
      TableName: "store_users",
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
      Limit: 1,
    })
  );

  if (existing.Items && existing.Items.length > 0) {
    console.error(`User with email ${email} already exists.`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 12);

  await docClient.send(
    new PutCommand({
      TableName: "store_users",
      Item: {
        userId: ulid(),
        email,
        name,
        passwordHash,
        role: "admin",
        accountType: "individual",
        preferredLanguage: "en",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    })
  );

  console.log(`Admin user created: ${email}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
