import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import jwt from "jsonwebtoken";
import { getUserById } from "../../lib/db/users";
import { signAccessToken, signRefreshToken } from "../../lib/auth/jwt";
import { success, badRequest, unauthorized, serverError } from "../../lib/utils/response";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || "{}");
    const parsed = refreshSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Refresh token is required");
    }

    const { refreshToken } = parsed.data;

    let decoded: { userId: string; type: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        userId: string;
        type: string;
      };
    } catch {
      return unauthorized("Invalid or expired refresh token");
    }

    if (decoded.type !== "refresh") {
      return unauthorized("Invalid token type");
    }

    const user = await getUserById(decoded.userId);
    if (!user || user.status === "suspended") {
      return unauthorized("User not found or suspended");
    }

    const newAccessToken = signAccessToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = signRefreshToken(user.userId);

    return success({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return serverError();
  }
}
