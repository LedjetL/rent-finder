import "server-only";
import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "./db";

/**
 * Self-contained session auth: scrypt password hashes and an HMAC-signed cookie.
 * No third-party auth service, so the app runs with zero API keys.
 *
 * Phone is the identity primitive, not email — it is the anti-spam signal, the
 * agency-detection signal and the paid-tier boundary all at once. Email + password
 * is kept as the dev-friendly login path; phone OTP replaces it before launch.
 *
 * Node-runtime only (node:crypto), which is why auth is checked in server
 * components and actions rather than in edge middleware.
 */

const COOKIE = "rf_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return s;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/**
 * Stable, non-reversible handle for a phone number. Copied onto every listing so
 * "how many live listings share this phone" is one index scan — the signal behind
 * both agency detection and the paid tier.
 */
export function hashPhone(phoneE164: string): string {
  return createHash("sha256").update(phoneE164).digest("hex").slice(0, 32);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expires}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Verifies signature and expiry. Returns the user id, or null. */
export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const idx = raw.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = raw.slice(0, idx);
  const signature = raw.slice(idx + 1);

  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  const [userId, expiresRaw] = payload.split(".");
  if (!userId || !expiresRaw) return null;
  if (Number(expiresRaw) < Date.now()) return null;
  return userId;
}

export type SessionUser = {
  id: string;
  displayName: string;
  email: string | null;
  photoUrl: string | null;
  phoneVerified: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      email: true,
      photoUrl: true,
      phoneVerifiedAt: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    photoUrl: user.photoUrl,
    phoneVerified: user.phoneVerifiedAt !== null,
  };
}

/** For server actions that must not run anonymously. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
