import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { TrpcContext } from "./_core/context";
const fixture = vi.hoisted(() => ({
  rows: [] as { productId: string; createdAt: Date }[],
  predicates: [] as unknown[],
  selections: [] as unknown[],
}));
vi.mock("./db", () => {
  const tx = {
    select: (selection: unknown) => {
      fixture.selections.push(selection);
      return {
        from: () => ({
          where: (predicate: unknown) => {
            fixture.predicates.push(predicate);
            return { limit: async () => fixture.rows };
          },
        }),
      };
    },
    delete: () => ({
      where: async (predicate: unknown) => {
        fixture.predicates.push(predicate);
        return { affectedRows: 0 };
      },
    }),
  };
  return {
    requireDb: async () => tx,
    commerceTransaction: async (work: (input: typeof tx) => unknown) =>
      work(tx),
  };
});
import { interestRouter } from "./interest";
import {
  rememberReferral,
  pendingReferral,
  forgetReferral,
} from "../client/src/lib/pending-referral";
const ctx = (userId?: number): TrpcContext => ({
  user: userId
    ? {
        id: userId,
        openId: "isolated",
        name: null,
        email: null,
        loginMethod: null,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null,
  req: { headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});
beforeEach(() => {
  fixture.rows = [];
  fixture.predicates = [];
  fixture.selections = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("Saved interest visibility and withdrawal", () => {
  it("rejects list and withdrawal before reading an unauthenticated account", async () => {
    const caller = interestRouter.createCaller(ctx());
    await expect(caller.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.leave({ productId: "field-notes-kit" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(fixture.predicates).toHaveLength(0);
  });
  it("selects only the authenticated owner's interests and exposes no identity", async () => {
    fixture.rows = [
      {
        productId: "field-notes-kit",
        createdAt: new Date("2026-11-04T00:00:00Z"),
      },
    ];
    const rows = await interestRouter.createCaller(ctx(111)).mine();
    expect(rows[0].title).toBe("Field Notes Kit");
    expect(Object.keys(rows[0]).sort()).toEqual([
      "createdAt",
      "productId",
      "title",
    ]);
    expect(Object.keys(fixture.selections[0] as object).sort()).toEqual([
      "createdAt",
      "productId",
    ]);
    const sql = new MySqlDialect().sqlToQuery(fixture.predicates[0] as any);
    expect(sql.params).toEqual([111]);
  });
  it("withdraws by both owner and product, and is idempotent even for an obsolete reference", async () => {
    await expect(
      interestRouter
        .createCaller(ctx(111))
        .leave({ productId: "obsolete-source" })
    ).resolves.toEqual({ removed: true, productId: "obsolete-source" });
    const sql = new MySqlDialect().sqlToQuery(fixture.predicates[0] as any);
    expect(sql.params).toEqual([111, "obsolete-source"]);
  });
  it("rejects owner injection in withdrawal input", async () => {
    await expect(
      interestRouter
        .createCaller(ctx(111))
        .leave({ productId: "field-notes-kit", userId: 999 } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fixture.predicates).toHaveLength(0);
  });
});
describe("Referral intent is bounded and never automatically applied", () => {
  function storage() {
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    return values;
  }
  it("keeps only a valid opaque referral code for ten minutes, then removes it", () => {
    vi.useFakeTimers();
    storage();
    rememberReferral("opaque-code-123");
    expect(pendingReferral()).toBe("opaque-code-123");
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(pendingReferral()).toBe("");
  });
  it("ignores malformed input and clears explicit withdrawal or applied intent", () => {
    storage();
    rememberReferral("https://example.test/invalid");
    expect(pendingReferral()).toBe("");
    rememberReferral("opaque-code-123");
    forgetReferral();
    expect(pendingReferral()).toBe("");
  });
});
