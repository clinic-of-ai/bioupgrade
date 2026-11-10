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
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewardEvents_id` PRIMARY KEY(`id`)
);
