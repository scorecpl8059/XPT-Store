import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { listAllCategories, listChildCategories } from "../../lib/db/categories";
import { success, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const parentId = event.queryStringParameters?.parentId;

    const categories = parentId
      ? await listChildCategories(parentId)
      : await listAllCategories();

    return success({ categories });
  } catch (err) {
    console.error("List categories error:", err);
    return serverError();
  }
}
