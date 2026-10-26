"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, destroySession } from "@/lib/auth";
import type { ReportReason } from "@/generated/prisma/enums";

const REASONS: ReportReason[] = [
  "SCAM",
  "WRONG_PRICE",
  "ALREADY_RENTED",
  "AGENCY_POSING",
  "STOLEN_PHOTOS",
  "OTHER",
];

export async function toggleFavorite(formData: FormData) {
  const user = await getCurrentUser();
  const listingId = String(formData.get("listingId") ?? "");
  if (!user) redirect(`/login?next=/listings/${listingId}`);

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, listingId } });
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/favorites");
}

/**
 * Scam reporting.
 *
 * Fake listings and deposit fraud are the single biggest complaint about renting
 * in Tirana today, so this is core rather than a nice-to-have. Reports land in a
 * queue a human reads; nothing is auto-hidden on one report, because that would
 * hand competitors a takedown button.
 */
export async function reportListing(formData: FormData) {
  const user = await getCurrentUser();
  const listingId = String(formData.get("listingId") ?? "");
  if (!user) redirect(`/login?next=/listings/${listingId}`);

  const raw = String(formData.get("reason") ?? "");
  const reason = (REASONS as string[]).includes(raw) ? (raw as ReportReason) : "OTHER";
  const detail = String(formData.get("detail") ?? "").trim().slice(0, 1000) || null;

  await prisma.report.upsert({
    where: { listingId_reporterId: { listingId, reporterId: user.id } },
    create: { listingId, reporterId: user.id, reason, detail },
    update: { reason, detail },
  });

  await prisma.event.create({
    data: {
      verb: "LISTING_REPORTED",
      subjectType: "Listing",
      subjectId: listingId,
      actorUserId: user.id,
      metadata: { reason },
    },
  });

  revalidatePath(`/listings/${listingId}`);
  redirect(`/listings/${listingId}?reported=1`);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
