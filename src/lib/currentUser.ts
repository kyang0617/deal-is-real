import "server-only";
import { db } from "@/lib/db";
import { DEMO_USER_EMAIL } from "@/lib/demoUser";

/**
 * The signed-in user. Until real auth lands (Phase 5) this is the seeded demo user.
 * Every caller goes through here so swapping in auth is a one-file change.
 */
export async function getCurrentUser() {
  const user = await db.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) throw new Error("Demo user not found. Run `npm run db:seed`.");
  return user;
}
