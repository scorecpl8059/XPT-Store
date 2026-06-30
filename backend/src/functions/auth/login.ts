import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserByEmail } from "../../lib/db/users";
import { verifyPassword } from "../../lib/auth/password";
import { signAccessToken, signRefreshToken } from "../../lib/auth/jwt";
import { verifyTotpCode } from "../../lib/auth/two-factor";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "../../lib/auth/rate-limit";
import {
  success,
  badRequest,
  unauthorized,
  serverError, initCors } from "../../lib/utils/response";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const body = JSON.parse(event.body || "{}");
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { email, password } = parsed.data;

    // Rate limit check by email
    const rateCheck = await checkRateLimit(email);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers: {
          "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Too many login attempts. Please try again later.",
          lockedUntil: rateCheck.lockedUntil,
        }),
      };
    }

    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      await recordFailedAttempt(email);
      return unauthorized("Invalid email or password");
    }

    if (user.status === "suspended") {
      return unauthorized("Account is suspended");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const locked = await recordFailedAttempt(email);
      if (locked) {
        return {
          statusCode: 429,
          headers: {
            "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error:
              "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.",
          }),
        };
      }
      return unauthorized("Invalid email or password");
    }

    // 2FA check for admin users with TOTP enabled
    if (user.totpEnabled && user.totpSecret) {
      const { totpCode } = parsed.data;
      if (!totpCode) {
        return success({ requires2FA: true, message: "2FA code required" }, 200);
      }
      if (!verifyTotpCode(user.totpSecret, totpCode)) {
        await recordFailedAttempt(email);
        return unauthorized("Invalid 2FA code");
      }
    }

    // Success — reset rate limit
    await resetRateLimit(email);

    const accessToken = signAccessToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.userId);

    return success({
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        accountType: user.accountType,
        companyName: user.companyName,
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return serverError();
  }
}
