import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET = process.env.S3_BUCKET_NAME!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

/**
 * Generate a presigned URL for uploading a file to S3.
 * Paths: products/{productId}/{filename}, reviews/{reviewId}/{filename}, returns/{returnId}/{filename}
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Get a public URL for an object — prefer CloudFront if configured.
 */
export function getPublicUrl(key: string): string {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
}

/**
 * Generate a presigned URL for downloading a private object.
 */
export async function generatePresignedGetUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Delete an object from S3.
 */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Build an S3 key for product images.
 */
export function productImageKey(
  productId: string,
  filename: string
): string {
  return `products/${productId}/${filename}`;
}

/**
 * Build an S3 key for review images.
 */
export function reviewImageKey(
  reviewId: string,
  filename: string
): string {
  return `reviews/${reviewId}/${filename}`;
}

/**
 * Build an S3 key for return images.
 */
export function returnImageKey(
  returnId: string,
  filename: string
): string {
  return `returns/${returnId}/${filename}`;
}
