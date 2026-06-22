import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { createReview } from "../../lib/db/reviews";
import { createReviewSchema } from "../../lib/utils/validation";
import {
  created,
  badRequest,
  unauthorized,
  serverError,
} from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const productId = event.pathParameters?.id;
    if (!productId) {
      return badRequest("Product ID is required");
    }

    const body = JSON.parse(event.body || "{}");
    const parsed = createReviewSchema.safeParse({ ...body, productId });

    if (!parsed.success) {
      return badRequest(parsed.error.issues?.[0]?.message ?? "Validation failed");
    }

    const review = await createReview(user.userId, user.email, parsed.data);

    return created({ review });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error creating review:", error);
    return serverError();
  }
}
