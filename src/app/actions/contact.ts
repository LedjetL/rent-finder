"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Revealing a contact is the single most important event on the site.
 *
 * Chat lives on WhatsApp, not here — that is a deliberate scope cut. The price of
 * that cut is that CONTACT_REVEALED → LISTING_MARKED_TAKEN is the *entire* funnel we
 * can observe, so this write is not analytics garnish. It is how we answer "did this
 * platform actually produce matches?" a year from now.
 */

export type RevealResult =
  | { ok: true; phone: string; waUrl: string }
  | { ok: false; reason: "UNAUTHENTICATED" | "NOT_FOUND" };

export async function revealContact(listingId: string): Promise<RevealResult> {
  // Server Actions are reachable by direct POST, so authorise inside the action.
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "UNAUTHENTICATED" };

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: "ACTIVE", moderationState: "APPROVED" },
    select: {
      id: true,
      title: true,
      priceEurCents: true,
      area: { select: { slug: true } },
      owner: { select: { id: true, phoneE164: true } },
    },
  });
  if (!listing) return { ok: false, reason: "NOT_FOUND" };

  await prisma.$transaction([
    prisma.event.create({
      data: {
        verb: "CONTACT_REVEALED",
        subjectType: "Listing",
        subjectId: listing.id,
        actorUserId: user.id,
        metadata: {
          via: "whatsapp",
          area: listing.area?.slug ?? null,
          priceEurCents: listing.priceEurCents,
        },
      },
    }),
    prisma.listing.update({
      where: { id: listing.id },
      data: { contactCount: { increment: 1 } },
    }),
  ]);

  const text = encodeURIComponent(
    `Përshëndetje! Jam i interesuar për njoftimin "${listing.title}".`,
  );
  const digits = listing.owner.phoneE164.replace(/[^0-9]/g, "");

  return {
    ok: true,
    phone: listing.owner.phoneE164,
    waUrl: `https://wa.me/${digits}?text=${text}`,
  };
}
