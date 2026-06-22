import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateRfqStatus } from "../../lib/db/rfq";
import { success, badRequest, unauthorized, forbidden, serverError } from "../../lib/utils/response";

const VALID_STATUSES = ["pending", "quoted", "accepted", "rejected", "expired"] as const;

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("RFQ ID is required");
    }

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { status } = JSON.parse(event.body);

    if (!VALID_STATUSES.includes(status)) {
      return badRequest(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const rfq = await updateRfqStatus(id, status);

    return success({ rfq });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Update RFQ status error:", err);
    return serverError();
  }
}
