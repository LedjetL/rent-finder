"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE } from "@/lib/i18n";

/**
 * Language is a cookie rather than a URL segment. Albanian and English readers share
 * every listing, so splitting the routes would fragment SEO across two URLs for the
 * same room and double the work on every link.
 */
export async function setLanguage(formData: FormData) {
  const next = formData.get("lang") === "en" ? "en" : "sq";
  const jar = await cookies();
  jar.set(LANG_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
