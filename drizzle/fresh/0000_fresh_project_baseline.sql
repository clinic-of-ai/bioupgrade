CREATE TABLE `commerceLocks` (
	`id` int NOT NULL,
	CONSTRAINT `commerceLocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commerceOrders` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`productId` varchar(128) NOT NULL,
	`productTitle` varchar(255) NOT NULL,
	`catalog` varchar(16) NOT NULL,
	`productKind` varchar(32) NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'eur',
	`checkoutMode` enum('payment','subscription') NOT NULL,
	`status` enum('created','pending','paid','failed','canceled','partially_refunded','refunded','disputed') NOT NULL DEFAULT 'created',
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`productPaidCents` int NOT NULL DEFAULT 0,
	`refundedCents` int NOT NULL DEFAULT 0,
	`purchasePoints` int NOT NULL DEFAULT 0,
	`firstPurchasePoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`fulfilledAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceOrders_stripeSessionId_unique` UNIQUE(`stripeSessionId`),
	CONSTRAINT `commerceOrders_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `commercePaymentEvents` (
	`eventId` varchar(255) NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`orderId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commercePaymentEvents_eventId` PRIMARY KEY(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `productInterests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` varchar(128) NOT NULL,
	`consentVersion` varchar(32) NOT NULL DEFAULT 'interest-v1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productInterests_id` PRIMARY KEY(`id`),
	CONSTRAINT `productInterests_user_product` UNIQUE(`userId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `referralCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referralCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referralCodes_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `referralCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerUserId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(32) NOT NULL,
	`status` enum('pending','qualified','earned','revoked','expired','capped') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`qualifiedAt` timestamp,
	`releaseAt` timestamp,
	`orderId` varchar(64),
	`rewardPoints` int NOT NULL DEFAULT 0,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referredUserId_unique` UNIQUE(`referredUserId`),
	CONSTRAINT `referrals_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `rewardAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pointsBalance` int NOT NULL DEFAULT 0,
	`lifetimePoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewardAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `rewardAccounts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `rewardEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`points` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`referenceId` varchar(128),
	`dedupKey` varchar(191),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewardEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `rewardEvents_dedupKey_unique` UNIQUE(`dedupKey`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `commerceOrders_user_created` ON `commerceOrders` (`userId`,`createdAt`);