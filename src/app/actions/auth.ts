"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  hashPhone,
  verifyPassword,
} from "@/lib/auth";

/**
 * Email + password is the interim login. Phone OTP replaces it before launch —
 * phone is already the identity primitive in the schema, because it is what makes
 * agency detection and the paid tier possible. The password column is nullable so
 * that swap does not need a migration.
 */

function safeNext(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  // Only same-site paths, so this cannot be used as an open redirect.
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const user = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { id: true, passwordHash: true },
      })
    : null;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  await createSession(user.id);
  redirect(next);
}

export async function register(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").replace(/[^0-9+]/g, "");
  const next = safeNext(formData.get("next"));

  if (!email || password.length < 8 || !displayName || phoneRaw.length < 8) {
    redirect(`/register?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const phoneE164 = phoneRaw.startsWith("+")
    ? phoneRaw
    : `+355${phoneRaw.replace(/^0+/, "")}`;

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email }, { phoneE164 }] },
    select: { id: true },
  });
  if (clash) {
    redirect(`/register?error=taken&next=${encodeURIComponent(next)}`);
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      displayName,
      phoneE164,
      phoneHash: hashPhone(phoneE164),
      locale: "sq",
    },
    select: { id: true },
  });

  await prisma.event.create({
    data: {
      verb: "USER_REGISTERED",
      subjectType: "User",
      subjectId: user.id,
      actorUserId: user.id,
    },
  });

  await createSession(user.id);
  redirect(next);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
