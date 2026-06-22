import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserById, updateUser } from "../../lib/db/users";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { generateTotpSecret, verifyTotpCode } from "../../lib/auth/two-factor";
import { success, badRequest, unauthorized, forbidden, serverError } from "../../lib/utils/response";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().length(6),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const authUser = requireAuth(event);

    // Only admin users can set up 2FA
    if (authUser.role !== "admin") {
      return forbidden("2FA is only available for admin accounts");
    }

    const user = await getUserById(authUser.userId);
    if (!user) return unauthorized("User not found");

    const method = event.httpMethod;

    // GET — Generate a new TOTP secret and QR code
    if (method === "GET") {
      const { secret, qrCodeDataUrl } = await generateTotpSecret(user.email);

      // Store secret temporarily (not yet enabled)
      await updateUser(user.userId, { totpSecret: secret });

      return success({ qrCodeDataUrl });
    }

    // POST — Verify code and enable 2FA
    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const parsed = verifySchema.safeParse(body);
      if (!parsed.success) return badRequest("Invalid code format");

      if (!user.totpSecret) {
        return badRequest("Set up 2FA first by calling GET");
      }

      const valid = verifyTotpCode(user.totpSecret, parsed.data.code);
      if (!valid) {
        return badRequest("Invalid verification code");
      }

      await updateUser(user.userId, { totpEnabled: true });

      return success({ message: "2FA enabled successfully" });
    }

    // DELETE — Disable 2FA
    if (method === "DELETE") {
      await updateUser(user.userId, {
        totpEnabled: false,
        totpSecret: undefined,
      });
      return success({ message: "2FA disabled" });
    }

    return badRequest("Method not allowed");
  } catch (error) {
    if (error instanceof AuthError) return unauthorized(error.message);
    console.error("2FA setup error:", error);
    return serverError();
  }
}
