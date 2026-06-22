import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserById } from "../../lib/db/users";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { success, unauthorized, notFound, serverError } from "../../lib/utils/response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const authUser = requireAuth(event);

    const user = await getUserById(authUser.userId);
    if (!user) {
      return notFound("User not found");
    }

    return success({
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      accountType: user.accountType,
      companyName: user.companyName,
      taxId: user.taxId,
      phone: user.phone,
      avatar: user.avatar,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      createdAt: user.createdAt,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Me error:", error);
    return serverError();
  }
}
