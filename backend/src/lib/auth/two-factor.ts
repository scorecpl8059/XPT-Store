import speakeasy from "speakeasy";
import QRCode from "qrcode";

const APP_NAME = "XPT-TECH Store";

/**
 * Generate a new TOTP secret for a user.
 * Returns the secret (to store in DB) and a QR code data URL (to show to user).
 */
export async function generateTotpSecret(
  email: string
): Promise<{ secret: string; qrCodeDataUrl: string }> {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${email})`,
    issuer: APP_NAME,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || "");

  return {
    secret: secret.base32,
    qrCodeDataUrl,
  };
}

/**
 * Verify a TOTP code against a stored secret.
 */
export function verifyTotpCode(secret: string, code: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 1, // Allow 1 period before/after for clock drift
  });
}
