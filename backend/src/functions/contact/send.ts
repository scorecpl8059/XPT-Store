import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, badRequest, serverError, initCors } from "../../lib/utils/response";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    if (!event.body) {
      return badRequest("Request body is required");
    }

    const { name, email, subject, message } = JSON.parse(event.body);

    if (!name || !email || !subject || !message) {
      return badRequest("Name, email, subject, and message are all required");
    }

    if (!EMAIL_REGEX.test(email)) {
      return badRequest("Invalid email format");
    }

    // Log the contact message (SES integration can be added later)
    console.log("Contact message received:", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    return success({ message: "Contact message sent" });
  } catch (err) {
    console.error("Contact send error:", err);
    return serverError();
  }
}
