#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DatabaseStack } from "../lib/database-stack";
import { StorageStack } from "../lib/storage-stack";
import { SecurityStack } from "../lib/security-stack";
import { ApiStack } from "../lib/api-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "us-east-1",
};

const database = new DatabaseStack(app, "XptStore-Database", { env });

const storage = new StorageStack(app, "XptStore-Storage", { env });

const security = new SecurityStack(app, "XptStore-Security", { env });

new ApiStack(app, "XptStore-Api", {
  env,
  tables: database.tables,
  bucket: storage.bucket,
  distribution: storage.distribution,
});
