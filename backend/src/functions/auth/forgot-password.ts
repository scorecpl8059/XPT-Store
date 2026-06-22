import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserByEmail } from "../../lib/db/users";
import { success, badRequest, serverError } from "../../lib/utils/response";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || "{}");
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Valid email is required");
    }

    const { email } = parsed.data;
    const user = await getUserByEmail(email);

    // Always return success to prevent email enumeration
    if (user) {
      // TODO: Generate reset token, store in store_verification_tokens,
      // and send reset email via SES (Phase 5)
      console.log(`Password reset requested for user: ${user.userId}`);
    }

    return success({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return serverError();
  }
}
