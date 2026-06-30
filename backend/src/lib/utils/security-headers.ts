/**
 * Security headers to add to all API responses.
 * These protect against common web vulnerabilities.
 */
export const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  // CSP: only allow scripts/styles from our own domain and trusted CDNs.
  // 'unsafe-inline' for styles is needed by Tailwind CSS.
  // img-src allows our S3 buckets and HTTPS images.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' https://www.googletagmanager.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data:",
    "connect-src 'self' https://*.amazonaws.com https://api.stripe.com https://www.google-analytics.com",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};
