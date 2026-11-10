import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { getTableName, SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
const fixture = vi.hoisted(() => ({
  tables: {} as Record<string, any[]>,
  dialect: null as any,
  tableName: null as any,
  queue: Promise.resolve(),
  db: null as any,
}));
vi.mock("drizzle-orm/mysql2", () => ({ drizzle: () => fixture.db }));
import {
  commerceOrders,
  rewardAccounts,
  rewardEvents,
  referrals,
  referralCodes,
  commercePaymentEvents,
} from "../drizzle/schema";
import {
  applyVerifiedSnapshot,
  snapshotMatchesOrder,
  type PaymentSnapshot,
} from "./commerce";
import { appendRewardLedger, commerceTransaction } from "./db";
import { releaseReferralsTx, referralsRouter } from "./referrals";
import { interestRouter } from "./interest";
import type { TrpcContext } from "./_core/context";
fixture.dialect = new MySqlDialect();
fixture.tableName = getTableName;
function values(table: any) {
  return (fixture.tables[getTableName(table)] ??= []);
}
function predicate(sql: any, row: any) {
  if (!sql) return true;
  const query = fixture.dialect.sqlToQuery(sql);
  let p = 0;
  const expr = query.sql
    .replace(/`[^`]+`\.`([^`]+)`/g, (_: string, column: string) =>
      JSON.stringify(
        row[column] instanceof Date
          ? row[column].toISOString().slice(0, -1).replace("T", " ")
          : (row[column] ?? null)
      )
    )
    .replace(/\?/g, () => JSON.stringify(query.params[p++]))
    .replace(/\bis not null\b/gi, "!= null")
    .replace(/\bis null\b/gi, "== null")
    .replace(/\band\b/gi, "&&")
    .replace(/\bor\b/gi, "||")
    .replace(/(?<![<>!=])=(?!=)/g, "===");
  return Boolean(Function(`return (${expr})`)()); // Test-only SQL subset; never used by application code.
}
function selection(table: any, fields: any) {
  let where: any;
  let limit = Infinity;
  const q: any = {
    where(v: any) {
      where = v;
      return q;
    },
    limit(v: number) {
      limit = v;
      return q;
    },
    orderBy() {
      return q;
    },
    then(resolve: any, reject: any) {
      try {
        return Promise.resolve(
          values(table)
            .filter(row => predicate(where, row))
            .slice(0, limit)
            .map(row =>
              fields
                ? Object.fromEntries(
                    Object.entries(fields).map(([name, column]: any) => [
                      name,
                      row[column.name],
                    ])
                  )
                : { ...row }
            )
        ).then(resolve, reject);
      } catch (e) {
        return Promise.reject(e).then(resolve, reject);
      }
    },
  };
  return q;
}
const tx: any = {
  execute: async () => [[{ id: 1 }], []],
  select: (fields?: any) => ({
    from: (table: any) => selection(table, fields),
  }),
  insert: (table: any) => ({
    values: (input: any) => {
      const insert = (updates?: any) => {
        const rows = values(table);
        const existing =
          table === rewardAccounts
            ? rows.find(row => row.userId === input.userId)
            : undefined;
        if (existing && updates) {
          for (const [key, value] of Object.entries(updates.set)) {
            const query =
              value instanceof SQL ? fixture.dialect.sqlToQuery(value) : null;
            existing[key] = query ? existing[key] + query.params[0] : value;
          }
        } else
          rows.push({ id: rows.length + 1, createdAt: new Date(), ...input });
        return Promise.resolve();
      };
      return {
        onDuplicateKeyUpdate: insert,
        then: (resolve: any, reject: any) => insert().then(resolve, reject),
      };
    },
  }),
  update: (table: any) => ({
    set: (update: any) => ({
      where: async (where: any) => {
        for (const row of values(table))
          if (predicate(where, row)) Object.assign(row, update);
      },
    }),
  }),
};
fixture.db = {
  ...tx,
  transaction: (work: any) => {
    const result = fixture.queue.then(async () => {
      const before = structuredClone(fixture.tables);
      try {
        return await work(tx);
      } catch (e) {
        fixture.tables = before;
        throw e;
      }
    });
    fixture.queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  },
};
function seedOrder(id = "order-one", userId = 2) {
  const order: any = {
    id,
    userId,
    productId: "field-notes-kit",
    productTitle: "Immutable Kit",
    catalog: "marketplace",
    productKind: "field-kit",
    amountCents: 4800,
    currency: "eur",
    checkoutMode: "payment",
    status: "pending",
    stripeSessionId: `cs_${id}`,
    stripePaymentIntentId: null,
    stripeSubscriptionId: null,
    productPaidCents: 0,
    refundedCents: 0,
    purchasePoints: 0,
    firstPurchasePoints: 0,
    createdAt: new Date(Date.now() - 60_000),
    fulfilledAt: null,
    updatedAt: new Date(),
  };
  values(commerceOrders).push(order);
  return order;
}
function snapshot(
  order: any,
  extra: Partial<PaymentSnapshot> = {}
): PaymentSnapshot {
  return {
    orderId: order.id,
    sessionId: order.stripeSessionId,
    userReference: String(order.userId),
    productId: order.productId,
    catalog: order.catalog,
    priceCents: order.amountCents,
    currency: "eur",
    mode: "payment",
    paymentIntentId: `pi_${order.id}`,
    subscriptionId: null,
    paid: true,
    productCents: 3600,
    refundedCents: 0,
    fullyRefunded: false,
    disputed: false,
    sessionStatus: "complete",
    ...extra,
  };
}
function seedReferral(order: any, id = 1) {
  values(referrals).push({
    id,
    referrerUserId: 1,
    referredUserId: order.userId,
    referralCode: "opaque-referral-code",
    status: "pending",
    createdAt: new Date(Date.now() - 86_400_000),
    qualifiedAt: null,
    releaseAt: null,
    orderId: null,
    rewardPoints: 0,
  });
}
const context = (id: number): TrpcContext => ({
  user: {
    id,
    openId: `user-${id}`,
    name: null,
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { headers: {} } as any,
  res: {} as any,
});
beforeEach(() => {
  fixture.tables = {};
  fixture.queue = Promise.resolve();
  vi.stubEnv("DATABASE_URL", "test-fixture-never-a-real-connection");
});
afterEach(() => vi.unstubAllEnvs());
describe("durable commerce transaction orchestration (isolated fake MySQL transport)", () => {
  it("deduplicates concurrent event replays and separate paid events for the same order", async () => {
    const order = seedOrder();
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        applyVerifiedSnapshot(snapshot(order), {
          id: i < 4 ? "evt_test_same" : `evt_${i}`,
          type: "checkout.session.completed",
        })
      )
    );
    expect(values(rewardAccounts)[0].pointsBalance).toBe(136);
    expect(
      values(rewardEvents).filter(e => e.eventType === "purchase")
    ).toHaveLength(1);
    expect(
      values(rewardEvents).filter(e => e.eventType === "first_purchase")
    ).toHaveLength(1);
    expect(values(commercePaymentEvents)).toHaveLength(5);
  });
  it("unpaid completion stays pending, then delayed paid snapshot settles once", async () => {
    const order = seedOrder();
    await applyVerifiedSnapshot(snapshot(order, { paid: false }), {
      id: "evt_unpaid",
      type: "checkout.session.completed",
    });
    expect(values(rewardEvents)).toHaveLength(0);
    expect(order.status).toBe("pending");
    await applyVerifiedSnapshot(snapshot(order), {
      id: "evt_delayed",
      type: "payment_intent.succeeded",
    });
    expect(order.status).toBe("paid");
    expect(values(rewardAccounts)[0].pointsBalance).toBe(136);
  });
  it("rejects unknown/manipulated SKU and ownership without consuming the event", async () => {
    const order = seedOrder();
    expect(
      snapshotMatchesOrder(order, snapshot(order, { productId: "unknown" }))
    ).toBe(false);
    await expect(
      applyVerifiedSnapshot(snapshot(order, { userReference: "999" }), {
        id: "evt_owner",
        type: "payment_intent.succeeded",
      })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(values(commercePaymentEvents)).toHaveLength(0);
    expect(values(rewardEvents)).toHaveLength(0);
    await applyVerifiedSnapshot(snapshot(order, { orderId: "unknown" }), {
      id: "evt_unknown",
      type: "payment_intent.succeeded",
    });
    expect(values(rewardEvents)).toHaveLength(0);
  });
  it("reverses partial refunds, first bonus, and prevents stale paid snapshots from restoring points", async () => {
    const order = seedOrder();
    await applyVerifiedSnapshot(snapshot(order));
    await applyVerifiedSnapshot(snapshot(order, { refundedCents: 1200 }));
    expect(values(rewardAccounts)[0].pointsBalance).toBe(24);
    expect(values(rewardAccounts)[0].lifetimePoints).toBe(136);
    await Promise.all([
      applyVerifiedSnapshot(snapshot(order)),
      applyVerifiedSnapshot(snapshot(order, { refundedCents: 1200 })),
    ]);
    expect(values(rewardAccounts)[0].pointsBalance).toBe(24);
    await applyVerifiedSnapshot(
      snapshot(order, { refundedCents: 4800, fullyRefunded: true })
    );
    expect(values(rewardAccounts)[0].pointsBalance).toBe(0);
    expect(
      values(rewardEvents)
        .filter(e => e.points < 0)
        .map(e => e.points)
    ).toEqual([-12, -100, -24]);
  });
  it("holds 250 referral points for 14d, releases only after verified reads, then compensates a dispute", async () => {
    const order = seedOrder();
    seedReferral(order);
    await applyVerifiedSnapshot(snapshot(order));
    const ref = values(referrals)[0];
    expect(ref.status).toBe("qualified");
    const afterHold = new Date(ref.releaseAt.getTime() + 1);
    await commerceTransaction(tx =>
      releaseReferralsTx(tx, 1, afterHold, new Set())
    );
    expect(
      values(rewardAccounts).find(a => a.userId === 1)?.pointsBalance ?? 0
    ).toBe(0);
    await commerceTransaction(tx =>
      releaseReferralsTx(
        tx,
        1,
        new Date(ref.releaseAt.getTime() - 1),
        new Set([order.id])
      )
    );
    expect(ref.status).toBe("qualified");
    await Promise.all(
      [1, 2, 3].map(() =>
        commerceTransaction(tx =>
          releaseReferralsTx(tx, 1, afterHold, new Set([order.id]))
        )
      )
    );
    expect(values(rewardAccounts).find(a => a.userId === 1).pointsBalance).toBe(
      250
    );
    await applyVerifiedSnapshot(snapshot(order, { disputed: true }));
    expect(ref.status).toBe("revoked");
    expect(values(rewardAccounts).find(a => a.userId === 1).pointsBalance).toBe(
      0
    );
  });
  it("caps four qualified referrals per rolling 30d and expires old attributions", async () => {
    for (let i = 0; i < 5; i++) {
      const order = seedOrder(`order-${i}`, i + 2);
      seedReferral(order, i + 1);
      await applyVerifiedSnapshot(snapshot(order));
    }
    expect(values(referrals).map(r => r.status)).toEqual([
      "qualified",
      "qualified",
      "qualified",
      "qualified",
      "capped",
    ]);
    const order = seedOrder("expired", 10);
    seedReferral(order, 10);
    values(referrals).at(-1).createdAt = new Date(Date.now() - 31 * 86_400_000);
    await applyVerifiedSnapshot(snapshot(order));
    expect(values(referrals).at(-1).status).toBe("expired");
  });
  it("rejects self-referral, already-purchased buyers and attribution changes", async () => {
    values(referralCodes).push(
      { id: 1, userId: 1, code: "opaque-referral-code" },
      { id: 2, userId: 3, code: "other-opaque-code" }
    );
    await expect(
      referralsRouter
        .createCaller(context(1))
        .applyCode({ code: "opaque-referral-code" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const caller = referralsRouter.createCaller(context(2));
    await expect(
      caller.applyCode({ code: "opaque-referral-code" })
    ).resolves.toEqual({ applied: true, status: "pending" });
    await expect(
      caller.applyCode({ code: "opaque-referral-code" })
    ).resolves.toEqual({ applied: true, status: "pending" });
    await expect(
      caller.applyCode({ code: "other-opaque-code" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const purchased = seedOrder("old", 4);
    purchased.fulfilledAt = new Date();
    await expect(
      referralsRouter
        .createCaller(context(4))
        .applyCode({ code: "opaque-referral-code" })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
  it("deduplicates consented interest and rejects missing consent or medical fields", async () => {
    const caller = interestRouter.createCaller(context(2));
    const input = { productId: "field-notes-kit", consent: true as const };
    expect(await caller.join(input)).toMatchObject({
      joined: true,
      alreadyJoined: false,
    });
    expect(await caller.join(input)).toMatchObject({
      joined: true,
      alreadyJoined: true,
    });
    await expect(
      caller.join({ ...input, consent: false } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.join({ ...input, medicalNotes: "not collected" } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.join({ productId: "unknown", consent: true })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("atomically deduplicates negative ledger entries", async () => {
    const award = {
      userId: 2,
      points: 100,
      eventType: "purchase",
      dedupKey: "isolated-award",
    };
    await commerceTransaction(tx => appendRewardLedger(tx, award));
    await Promise.all(
      [1, 2, 3].map(() =>
        commerceTransaction(tx =>
          appendRewardLedger(tx, {
            ...award,
            points: -100,
            eventType: "refund_reversal",
            dedupKey: "isolated-refund",
          })
        )
      )
    );
    expect(values(rewardAccounts)[0]).toMatchObject({
      pointsBalance: 0,
      lifetimePoints: 100,
    });
    expect(values(rewardEvents)).toHaveLength(2);
  });
  it("preserves legacy balances/events and does not treat a legacy buyer as a first purchase", async () => {
    values(rewardAccounts).push({
      id: 1,
      userId: 2,
      pointsBalance: 500,
      lifetimePoints: 500,
    });
    values(rewardEvents).push({
      id: 1,
      userId: 2,
      points: 500,
      eventType: "purchase",
      referenceId: "legacy-event",
      createdAt: new Date(),
    });
    const order = seedOrder();
    await applyVerifiedSnapshot(snapshot(order));
    expect(values(rewardAccounts)[0]).toMatchObject({
      pointsBalance: 536,
      lifetimePoints: 536,
    });
    expect(values(rewardEvents)[0]).toMatchObject({
      referenceId: "legacy-event",
      points: 500,
    });
    expect(
      values(rewardEvents).filter(e => e.eventType === "first_purchase")
    ).toHaveLength(0);
    const research = seedOrder("research", 3);
    research.productKind = "peptide";
    seedReferral(research, 2);
    await expect(
      applyVerifiedSnapshot(snapshot(research))
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(values(referrals).find(r => r.id === 2).status).toBe("pending");
  });
  it("enforces the 25-product interest cap without pretending another interest was saved", async () => {
    fixture.tables.productInterests = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      userId: 2,
      productId: `existing-${i}`,
    }));
    await expect(
      interestRouter
        .createCaller(context(2))
        .join({ productId: "field-notes-kit", consent: true })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(fixture.tables.productInterests).toHaveLength(25);
  });
});
