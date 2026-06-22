import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth } from "../../lib/auth/middleware";
import { AuthError } from "../../lib/auth/middleware";
import { generatePresignedUploadUrl } from "../../lib/aws/s3";
import { success, badRequest, unauthorized, forbidden, serverError } from "../../lib/utils/response";
import { z } from "zod";

const presignSchema = z.object({
  folder: z.enum(["products", "reviews", "returns", "categories"]),
  entityId: z.string().min(1),
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/, "Only JPEG, PNG, WebP, and GIF images are allowed"),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const user = requireAuth(event);

    const body = JSON.parse(event.body || "{}");
    const parsed = presignSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { folder, entityId, filename, contentType } = parsed.data;

    // Only admins can upload to products and categories folders
    if (
      (folder === "products" || folder === "categories") &&
      user.role !== "admin"
    ) {
      return forbidden("Only admins can upload product/category images");
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${folder}/${entityId}/${Date.now()}-${sanitizedFilename}`;

    const uploadUrl = await generatePresignedUploadUrl(key, contentType);

    return success({ uploadUrl, key });
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("Presign error:", err);
    return serverError();
  }
}
