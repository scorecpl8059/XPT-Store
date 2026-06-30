import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { updateReviewStatus } from "../../lib/db/reviews";
import { success, badRequest, unauthorized, forbidden, serverError, initCors } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    requireAdmin(event);

    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("Review ID is required");
    }

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { productId, status } = JSON.parse(event.body);

    if (!productId) {
      return badRequest("productId is required");
    }

    if (status !== "approved" && status !== "rejected") {
      return badRequest("Status must be 'approved' or 'rejected'");
    }

    const review = await updateReviewStatus(productId, id, status);

    return success({ review });
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message);
    }
    console.error("Update review status error:", err);
    return serverError();
  }
}
