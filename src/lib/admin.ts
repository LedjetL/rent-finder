import "server-only";
import { getCurrentUser, type SessionUser } from "./auth";

/**
 * Who can work the moderation queue.
 *
 * An env var rather than a database flag, deliberately: it needs no migration, it
 * cannot be escalated by anything that compromises the app's own data, and at this
 * stage the list is one person. Move it into the schema when there is a team.
 *
 * ADMIN_EMAILS="you@example.com,someone@example.com"
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = adminEmails();
  return list.length > 0 && list.includes(email.toLowerCase());
}

/** Returns the admin user, or null. Never throws — callers decide what to render. */
export async function getAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user && isAdminEmail(user.email) ? user : null;
}
