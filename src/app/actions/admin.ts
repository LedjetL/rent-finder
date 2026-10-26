"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdmin } from "@/lib/admin";

/**
 * Moderation actions.
 *
 * Every one of these re-checks admin rights inside the action: Server Actions are
 * reachable by direct POST, so a hidden button is not access control.
 */

export async function approveListing(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) return;

  const listingId = String(formData.get("listingId") ?? "");
  const verifyPhone = formData.get("verifyPhone") === "1";

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true },
  });
  if (!listing) return;

  await prisma.listing.update({
    where: { id: listing.id },
    data: { moderationState: "APPROVED" },
  });

  // Approving after a phone call is *how* the phone gets verified at this stage —
  // tier 0 of the verification ladder. Cheaper than any OTP provider and it also
  // tells you things an SMS never will.
  if (verifyPhone) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: listing.ownerId },
        data: { phoneVerifiedAt: new Date() },
      }),
      prisma.verification.upsert({
        where: { userId_kind: { userId: listing.ownerId, kind: "PHONE" } },
        create: {
          userId: listing.ownerId,
          kind: "PHONE",
          state: "VERIFIED",
          verifiedAt: new Date(),
          verifiedBy: admin.id,
          note: "Verified by phone call during manual review",
        },
        update: {
          state: "VERIFIED",
          verifiedAt: new Date(),
          verifiedBy: admin.id,
        },
      }),
    ]);
  }

  revalidatePath("/admin");
  revalidatePath("/listings");
}

export async function rejectListing(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) return;

  const listingId = String(formData.get("listingId") ?? "");
  await prisma.listing.updateMany({
    where: { id: listingId },
    data: { moderationState: "REJECTED" },
  });

  revalidatePath("/admin");
  revalidatePath("/listings");
}

/** Hide a listing from search without deleting it — the response to a live scam. */
export async function shadowListing(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) return;

  const listingId = String(formData.get("listingId") ?? "");
  await prisma.listing.updateMany({
    where: { id: listingId },
    data: { moderationState: "SHADOW" },
  });

  revalidatePath("/admin");
  revalidatePath("/listings");
}

export async function resolveReport(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) return;

  const reportId = String(formData.get("reportId") ?? "");
  await prisma.report.updateMany({ where: { id: reportId }, data: { resolved: true } });

  revalidatePath("/admin");
}
