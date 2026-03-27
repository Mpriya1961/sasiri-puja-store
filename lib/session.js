import crypto from "crypto";

export const SESSION_COOKIE_NAME = "admin_session";

export function signSessionPayload(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  return `${body}.${sig}`;
}

export function verifySessionToken(token) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret || !token || !token.includes(".")) return null;

    const [body, sig] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64url");

    const sigBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

    if (!payload?.username || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}