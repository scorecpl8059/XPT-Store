import type { APIGatewayProxyEvent } from "aws-lambda";
import { verifyToken, type JwtPayload } from "./jwt";

export function getAuthUser(event: APIGatewayProxyEvent): JwtPayload | null {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(event: APIGatewayProxyEvent): JwtPayload {
  const user = getAuthUser(event);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export function requireAdmin(event: APIGatewayProxyEvent): JwtPayload {
  const user = requireAuth(event);
  if (user.role !== "admin") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
