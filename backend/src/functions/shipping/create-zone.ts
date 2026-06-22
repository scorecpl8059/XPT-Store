import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { createZone } from "../../lib/db/shipping";
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
    requireAdmin(event);

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const input = JSON.parse(event.body);

    if (!input.name) {
      return badRequest("Name is required");
    }

    if (!input.states || !Array.isArray(input.states) || input.states.length === 0) {
      return badRequest("States array is required");
    }

    const zone = await createZone({
      name: input.name,
      states: input.states,
      rates: input.rates || [],
    });

    return created({ zone });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error creating shipping zone:", error);
    return serverError();
  }
}
