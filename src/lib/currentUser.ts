import "server-only";
import { db } from "@/lib/db";

export const DEMO_USER_EMAIL = "demo@dealisreal.local";

/**
 * The signed-in user. Until real auth lands (Phase 5) this is the seeded demo user.
 * Every caller goes through here so swapping in auth is a one-file change.
 */
export async function getCurrentUser() {
  const user = await db.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) throw new Error("Demo user not found. Run `npm run db:seed`.");
  return user;
}
