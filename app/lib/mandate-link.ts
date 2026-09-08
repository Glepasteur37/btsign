import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type MandateLinkClaims = {
  adminId: string;
  fees: string;
  issuedAt: number;
};

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(encodedClaims: string, secret: string) {
  return createHmac("sha256", secret).update(encodedClaims).digest("base64url");
}

function getSigningSecret() {
  const secret = process.env.MANDATE_LINK_SECRET;
  if (!secret) throw new Error("MANDATE_LINK_SECRET is not configured.");
  return secret;
}

export function getAuthenticatedAdminId(password: string) {
  const expectedPassword = process.env.MANDATE_ADMIN_PASSWORD;
  const adminId = process.env.MANDATE_ADMIN_ID;
  if (!expectedPassword || !adminId) throw new Error("Mandate administrator is not configured.");

  const actual = Buffer.from(password);
  const expected = Buffer.from(expectedPassword);
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? adminId : null;
}

export function createMandateLinkToken(adminId: string, fees: string) {
  const claims: MandateLinkClaims = { adminId, fees, issuedAt: Date.now() };
  const encodedClaims = encode(JSON.stringify(claims));
  return `${encodedClaims}.${sign(encodedClaims, getSigningSecret())}`;
}

export function verifyMandateLinkToken(token: string): MandateLinkClaims | null {
  const [encodedClaims, suppliedSignature, ...extra] = token.split(".");
  if (!encodedClaims || !suppliedSignature || extra.length > 0) return null;

  const expectedSignature = sign(encodedClaims, getSigningSecret());
  const actual = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const claims: unknown = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8"));
    if (
      !claims || typeof claims !== "object" ||
      typeof (claims as MandateLinkClaims).adminId !== "string" ||
      typeof (claims as MandateLinkClaims).fees !== "string" ||
      typeof (claims as MandateLinkClaims).issuedAt !== "number" ||
      Date.now() - (claims as MandateLinkClaims).issuedAt > TOKEN_TTL_MS
    ) return null;
    return claims as MandateLinkClaims;
  } catch {
    return null;
  }
}
