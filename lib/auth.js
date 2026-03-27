import crypto from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import AuthSetting from "@/models/AuthSetting";

const SESSION_COOKIE_NAME = "admin_session";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;

  const [salt, originalHash] = storedHash.split(":");
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (hashBuffer.length !== originalBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, originalBuffer);
}

function signSessionPayload(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  return `${body}.${sig}`;
}

function verifySignedSession(token) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret || !token || !token.includes(".")) return null;

    const [body, sig] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64url");

    if (sig !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

    if (!payload?.username || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function createAdminSession(username) {
  const token = signSessionPayload({
    username,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySignedSession(token);
}

export async function isAuthenticated() {
  const user = await getSessionUser();
  return Boolean(user);
}

export async function getAdminRecord() {
  await connectDB();
  return AuthSetting.findOne({ key: "admin_credentials" });
}

export async function getEffectiveAdminUsername() {
  const record = await getAdminRecord();
  return record?.username || process.env.ADMIN_USERNAME;
}

export async function verifyAdminLogin(username, password) {
  await connectDB();
  const record = await AuthSetting.findOne({ key: "admin_credentials" });

  if (record?.username && record?.passwordHash) {
    if (username !== record.username) return false;
    return verifyPassword(password, record.passwordHash);
  }

  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}

export async function setAdminPassword(newPassword) {
  await connectDB();

  const username = process.env.ADMIN_USERNAME || "admin";
  const passwordHash = hashPassword(newPassword);

  await AuthSetting.findOneAndUpdate(
    { key: "admin_credentials" },
    {
      key: "admin_credentials",
      username,
      passwordHash,
      resetTokenHash: "",
      resetTokenExpiry: null,
    },
    { upsert: true, new: true }
  );
}

export async function createResetToken() {
  await connectDB();

  const rawToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = sha256(rawToken);
  const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 30);

  await AuthSetting.findOneAndUpdate(
    { key: "admin_credentials" },
    {
      key: "admin_credentials",
      username: process.env.ADMIN_USERNAME || "admin",
      resetTokenHash,
      resetTokenExpiry,
    },
    { upsert: true, new: true }
  );

  return rawToken;
}

export async function verifyResetToken(rawToken) {
  await connectDB();

  const record = await AuthSetting.findOne({ key: "admin_credentials" });
  if (!record?.resetTokenHash || !record?.resetTokenExpiry) return false;

  if (new Date(record.resetTokenExpiry).getTime() < Date.now()) return false;

  return sha256(rawToken) === record.resetTokenHash;
}

export async function consumeResetTokenAndSetPassword(rawToken, newPassword) {
  await connectDB();

  const record = await AuthSetting.findOne({ key: "admin_credentials" });
  if (!record?.resetTokenHash || !record?.resetTokenExpiry) {
    return { ok: false, error: "Invalid token" };
  }

  if (new Date(record.resetTokenExpiry).getTime() < Date.now()) {
    return { ok: false, error: "Token expired" };
  }

  if (sha256(rawToken) !== record.resetTokenHash) {
    return { ok: false, error: "Invalid token" };
  }

  record.username = process.env.ADMIN_USERNAME || "admin";
  record.passwordHash = hashPassword(newPassword);
  record.resetTokenHash = "";
  record.resetTokenExpiry = null;
  await record.save();

  return { ok: true };
}