import "server-only";
import { createSecretKey } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export const MOBILE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const ISSUER = "papersmell";
const AUDIENCE = "papersmell-mobile";

type MobileUser = {
  id: string;
  name: string;
  email: string;
};

function getSigningKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be configured.");
  return createSecretKey(secret, "utf8");
}

export async function createMobileAccessToken(user: MobileUser) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + MOBILE_TOKEN_TTL_SECONDS)
    .sign(getSigningKey());
}

export async function readMobileAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getSigningKey(), {
    algorithms: ["HS256"],
    audience: AUDIENCE,
    issuer: ISSUER,
  });
  if (!payload.sub) return null;
  return { id: payload.sub };
}
