import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const rewardAccounts = mysqlTable("rewardAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  pointsBalance: int("pointsBalance").default(0).notNull(),
  lifetimePoints: int("lifetimePoints").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const rewardEvents = mysqlTable("rewardEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  points: int("points").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  referenceId: varchar("referenceId", { length: 128 }),
  // Preserve legacy reference duplicates; only new writes use the unique ledger key.
  dedupKey: varchar("dedupKey", { length: 191 }).unique(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const referralCodes = mysqlTable("referralCodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerUserId: int("referrerUserId").notNull(),
  referredUserId: int("referredUserId").notNull().unique(),
  referralCode: varchar("referralCode", { length: 32 }).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "qualified",
    "earned",
    "revoked",
    "expired",
    "capped",
  ])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  qualifiedAt: timestamp("qualifiedAt"),
  releaseAt: timestamp("releaseAt"),
  orderId: varchar("orderId", { length: 64 }).unique(),
  rewardPoints: int("rewardPoints").default(0).notNull(),
});

export type RewardAccount = typeof rewardAccounts.$inferSelect;
export type RewardEvent = typeof rewardEvents.$inferSelect;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type Referral = typeof referrals.$inferSelect;

export const commerceOrders = mysqlTable(
  "commerceOrders",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    productId: varchar("productId", { length: 128 }).notNull(),
    productTitle: varchar("productTitle", { length: 255 }).notNull(),
    catalog: varchar("catalog", { length: 16 }).notNull(),
    productKind: varchar("productKind", { length: 32 }).notNull(),
    amountCents: int("amountCents").notNull(),
    currency: varchar("currency", { length: 3 }).default("eur").notNull(),
    checkoutMode: mysqlEnum("checkoutMode", [
      "payment",
      "subscription",
    ]).notNull(),
    status: mysqlEnum("status", [
      "created",
      "pending",
      "paid",
      "failed",
      "canceled",
      "partially_refunded",
      "refunded",
      "disputed",
    ])
      .default("created")
      .notNull(),
    stripeSessionId: varchar("stripeSessionId", { length: 255 }).unique(),
    stripePaymentIntentId: varchar("stripePaymentIntentId", {
      length: 255,
    }).unique(),
    stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
    productPaidCents: int("productPaidCents").default(0).notNull(),
    refundedCents: int("refundedCents").default(0).notNull(),
    purchasePoints: int("purchasePoints").default(0).notNull(),
    firstPurchasePoints: int("firstPurchasePoints").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    fulfilledAt: timestamp("fulfilledAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  t => [index("commerceOrders_user_created").on(t.userId, t.createdAt)]
);

export const commercePaymentEvents = mysqlTable("commercePaymentEvents", {
  eventId: varchar("eventId", { length: 255 }).primaryKey(),
  eventType: varchar("eventType", { length: 96 }).notNull(),
  orderId: varchar("orderId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
// A transaction-scoped DB lock serializes small-store commerce/ledger/referral writes.
export const commerceLocks = mysqlTable("commerceLocks", {
  id: int("id").primaryKey(),
});
export const productInterests = mysqlTable(
  "productInterests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productId: varchar("productId", { length: 128 }).notNull(),
    consentVersion: varchar("consentVersion", { length: 32 })
      .default("interest-v1")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  t => [uniqueIndex("productInterests_user_product").on(t.userId, t.productId)]
);
export type CommerceOrder = typeof commerceOrders.$inferSelect;
