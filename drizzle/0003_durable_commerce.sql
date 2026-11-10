-- MANUAL ADDITIVE MIGRATION: see 0003_APPLY.md. No recovered migration journal exists.
-- Apply once only after backup/schema audit. MySQL DDL auto-commits; this is NOT a rollback-safe transaction.
ALTER TABLE `rewardEvents` ADD COLUMN `dedupKey` varchar(191) NULL;
CREATE UNIQUE INDEX `rewardEvents_dedupKey_unique` ON `rewardEvents` (`dedupKey`);
ALTER TABLE `referrals`
  MODIFY COLUMN `status` enum('pending','qualified','earned','revoked','expired','capped') NOT NULL DEFAULT 'pending',
  ADD COLUMN `qualifiedAt` timestamp NULL,
  ADD COLUMN `releaseAt` timestamp NULL,
  ADD COLUMN `orderId` varchar(64) NULL,
  ADD COLUMN `rewardPoints` int NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX `referrals_orderId_unique` ON `referrals` (`orderId`);
CREATE TABLE `commerceOrders` (
  `id` varchar(64) NOT NULL PRIMARY KEY,
  `userId` int NOT NULL,
  `productId` varchar(128) NOT NULL,
  `productTitle` varchar(255) NOT NULL,
  `catalog` varchar(16) NOT NULL,
  `productKind` varchar(32) NOT NULL,
  `amountCents` int NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'eur',
  `checkoutMode` enum('payment','subscription') NOT NULL,
  `status` enum('created','pending','paid','failed','canceled','partially_refunded','refunded','disputed') NOT NULL DEFAULT 'created',
  `stripeSessionId` varchar(255) NULL,
  `stripePaymentIntentId` varchar(255) NULL,
  `stripeSubscriptionId` varchar(255) NULL,
  `productPaidCents` int NOT NULL DEFAULT 0,
  `refundedCents` int NOT NULL DEFAULT 0,
  `purchasePoints` int NOT NULL DEFAULT 0,
  `firstPurchasePoints` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fulfilledAt` timestamp NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `commerceOrders_stripeSessionId_unique` (`stripeSessionId`),
  UNIQUE KEY `commerceOrders_stripePaymentIntentId_unique` (`stripePaymentIntentId`),
  KEY `commerceOrders_user_created` (`userId`,`createdAt`)
) ENGINE=InnoDB;
CREATE TABLE `commercePaymentEvents` (
  `eventId` varchar(255) NOT NULL PRIMARY KEY,
  `eventType` varchar(96) NOT NULL,
  `orderId` varchar(64) NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE `commerceLocks` (`id` int NOT NULL PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO `commerceLocks` (`id`) VALUES (1);
CREATE TABLE `productInterests` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `productId` varchar(128) NOT NULL,
  `consentVersion` varchar(32) NOT NULL DEFAULT 'interest-v1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `productInterests_user_product` (`userId`,`productId`)
) ENGINE=InnoDB;
