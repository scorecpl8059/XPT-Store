import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SECURITY_HEADERS } from "./security-headers";

// CORS: Match the request Origin against a whitelist and return only that single origin.
// This prevents the "multiple origins" browser error and restricts access to known frontends.
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Module-level origin storage. Safe because Lambda processes one request at a time per instance.
let _matchedOrigin = "";

/**
 * Call at the top of every handler to set the CORS origin for all response helpers.
 * Reads the request's Origin header and matches it against the FRONTEND_URL whitelist.
 */
export function initCors(event: APIGatewayProxyEvent): void {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || "";
  _matchedOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : "";
}

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": _matchedOrigin,
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
    ...SECURITY_HEADERS,
  };
}

export function success(body: unknown, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify(body),
  };
}

export function created(body: unknown): APIGatewayProxyResult {
  return success(body, 201);
}

export function noContent(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: getCorsHeaders(),
    body: "",
  };
}

export function badRequest(message: string): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: getCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function unauthorized(message = "Unauthorized"): APIGatewayProxyResult {
  return {
    statusCode: 401,
    headers: getCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function forbidden(message = "Forbidden"): APIGatewayProxyResult {
  return {
    statusCode: 403,
    headers: getCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function notFound(message = "Not found"): APIGatewayProxyResult {
  return {
    statusCode: 404,
    headers: getCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function serverError(message = "Internal server error"): APIGatewayProxyResult {
  return {
    statusCode: 500,
    headers: getCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}
