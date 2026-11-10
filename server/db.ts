import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { TRPCError } from "@trpc/server";
import {
  InsertUser,
  rewardAccounts,
  rewardEvents,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch {
      console.warn("[Database] Connection unavailable");
      _db = null;
    }
  }
  return _db;
}
export async function requireDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Account storage is unavailable. Please try again later.",
    });
  return db;
}
export type CommerceTx = Parameters<
  Parameters<Awaited<ReturnType<typeof requireDb>>["transaction"]>[0]
>[0];
export async function commerceTransaction<T>(
  work: (tx: CommerceTx) => Promise<T>
): Promise<T> {
  const db = await requireDb();
  try {
    return await db.transaction(async tx => {
      const rows = await tx.execute(
        sql`SELECT id FROM commerceLocks WHERE id = 1 FOR UPDATE`
      );
      if (!Array.isArray(rows[0]) || rows[0].length !== 1)
        throw new Error("Commerce migration not applied");
      return work(tx);
    });
  } catch (cause) {
    if (cause instanceof TRPCError) throw cause;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Commerce storage is unavailable. Please try again later.",
      cause,
    });
  }
}
export async function appendRewardLedger(
  tx: CommerceTx,
  input: {
    userId: number;
    points: number;
    eventType: string;
    dedupKey: string;
    referenceId?: string;
    note?: string;
  }
) {
  if (!Number.isSafeInteger(input.points)) throw new Error("Invalid points");
  const existing = await tx
    .select()
    .from(rewardEvents)
    .where(eq(rewardEvents.dedupKey, input.dedupKey))
    .limit(1);
  if (existing.length) return false;
  await tx.insert(rewardEvents).values(input);
  await tx
    .insert(rewardAccounts)
    .values({
      userId: input.userId,
      pointsBalance: input.points,
      lifetimePoints: Math.max(0, input.points),
    })
    .onDuplicateKeyUpdate({
      set: {
        pointsBalance: sql`${rewardAccounts.pointsBalance} + ${input.points}`,
        // Lifetime records historical positive earnings; reversals reduce the spendable balance.
        lifetimePoints: sql`${rewardAccounts.lifetimePoints} + ${Math.max(0, input.points)}`,
      },
    });
  return true;
}
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (
    await db.select().from(users).where(eq(users.openId, openId)).limit(1)
  )[0];
}
export async function getRewardAccount(userId: number) {
  const db = await requireDb();
  return (
    await db
      .select()
      .from(rewardAccounts)
      .where(eq(rewardAccounts.userId, userId))
      .limit(1)
  )[0];
}
export async function getRewardEvents(userId: number) {
  const db = await requireDb();
  return db
    .select()
    .from(rewardEvents)
    .where(eq(rewardEvents.userId, userId))
    .orderBy(desc(rewardEvents.createdAt))
    .limit(100);
}
export async function awardRewardPoints(input: {
  userId: number;
  points: number;
  eventType: string;
  referenceId?: string;
  note?: string;
}) {
  if (
    !input.referenceId ||
    !Number.isSafeInteger(input.points) ||
    input.points <= 0
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A positive, uniquely referenced award is required",
    });
  return commerceTransaction(async tx => {
    const old = await tx
      .select()
      .from(rewardEvents)
      .where(eq(rewardEvents.referenceId, input.referenceId!))
      .limit(1);
    if (!old.length)
      await appendRewardLedger(tx, {
        ...input,
        dedupKey: `award:${input.referenceId}`,
      });
    return (
      await tx
        .select()
        .from(rewardAccounts)
        .where(eq(rewardAccounts.userId, input.userId))
        .limit(1)
    )[0];
  });
}
