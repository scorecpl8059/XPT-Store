import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createUser, getUserByEmail } from "../../lib/db/users";
import { hashPassword } from "../../lib/auth/password";
import { signAccessToken, signRefreshToken } from "../../lib/auth/jwt";
import { createUserSchema } from "../../lib/utils/validation";
import { success, badRequest, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || "{}");
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { email, name, password, accountType, companyName, taxId, phone } =
      parsed.data;

    if (!password) {
      return badRequest("Password is required");
    }

    // Check if email already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return badRequest("Email already registered");
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      name,
      accountType,
      companyName,
      taxId,
      phone,
    });

    // Update user with password hash
    const { updateUser } = await import("../../lib/db/users");
    await updateUser(user.userId, { passwordHash });

    // Generate tokens
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
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Register error:", error);
    return serverError();
  }
}
