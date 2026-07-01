import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../lib/db/client";
import { Tables } from "../../lib/db/tables";
import { success, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const params = event.queryStringParameters || {};
    const categoryId = params.categoryId;
    const status = params.status;
    const limit = Math.min(parseInt(params.limit || "20"), 100);
    const startKey = params.startKey
      ? JSON.parse(decodeURIComponent(params.startKey))
      : undefined;

    let command;

    if (categoryId) {
      // Query by category
      command = new QueryCommand({
        TableName: Tables.PRODUCTS,
        IndexName: "categoryId-createdAt-index",
        KeyConditionExpression: "categoryId = :categoryId",
        ExpressionAttributeValues: { ":categoryId": categoryId },
        Limit: limit,
        ScanIndexForward: false,
        ExclusiveStartKey: startKey,
      });
    } else if (status) {
      // Query by specific status
      command = new QueryCommand({
        TableName: Tables.PRODUCTS,
        IndexName: "status-createdAt-index",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
        Limit: limit,
        ScanIndexForward: false,
        ExclusiveStartKey: startKey,
      });
    } else {
      // No filter — return all products
      command = new ScanCommand({
        TableName: Tables.PRODUCTS,
        Limit: limit,
        ExclusiveStartKey: startKey,
      });
    }

    const result = await docClient.send(command);

    return success({
      items: result.Items || [],
      nextKey: result.LastEvaluatedKey
        ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
        : null,
    });
  } catch (error) {
    console.error("Error listing products:", error);
    return serverError();
  }
}
