/**
 * Session helpers - resolve sessionId to userId for auth.
 * Used by queries/mutations that need to verify the caller.
 */
import type { GenericQueryCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";

export async function getUserIdFromSession(
  ctx: GenericQueryCtx<DataModel>,
  sessionId: string | null
): Promise<Id<"users"> | null> {
  if (!sessionId || typeof sessionId !== "string") return null;
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return session.userId;
}

export async function getUserIdFromSessionOrThrow(
  ctx: GenericQueryCtx<DataModel>,
  sessionId: string | null
): Promise<Id<"users">> {
  const userId = await getUserIdFromSession(ctx, sessionId);
  if (userId === null) throw new Error("Unauthorized: Invalid or expired session");
  return userId;
}
