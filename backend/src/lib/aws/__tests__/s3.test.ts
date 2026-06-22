import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  productImageKey,
  reviewImageKey,
  returnImageKey,
} from "../s3";

describe("key builders", () => {
  it("productImageKey builds correct path", () => {
    expect(productImageKey("prod-1", "photo.jpg")).toBe(
      "products/prod-1/photo.jpg"
    );
  });

  it("reviewImageKey builds correct path", () => {
    expect(reviewImageKey("rev-1", "img.png")).toBe("reviews/rev-1/img.png");
  });

  it("returnImageKey builds correct path", () => {
    expect(returnImageKey("ret-1", "damage.jpg")).toBe(
      "returns/ret-1/damage.jpg"
    );
  });
});

describe("getPublicUrl", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns CloudFront URL when CLOUDFRONT_DOMAIN is set", async () => {
    process.env.CLOUDFRONT_DOMAIN = "cdn.xpt-tech.com";
    const { getPublicUrl } = await import("../s3");
    const url = getPublicUrl("products/prod-1/photo.jpg");
    expect(url).toBe("https://cdn.xpt-tech.com/products/prod-1/photo.jpg");
    delete process.env.CLOUDFRONT_DOMAIN;
  });

  it("falls back to S3 URL when no CloudFront", async () => {
    delete process.env.CLOUDFRONT_DOMAIN;
    process.env.S3_BUCKET_NAME = "xpt-store-assets";
    const { getPublicUrl } = await import("../s3");
    const url = getPublicUrl("products/prod-1/photo.jpg");
    expect(url).toContain("xpt-store-assets");
    expect(url).toContain("products/prod-1/photo.jpg");
  });
});
