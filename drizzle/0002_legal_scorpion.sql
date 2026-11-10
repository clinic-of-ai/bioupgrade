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
	`status` enum('pending','qualified') NOT NULL DEFAULT 'qualified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referredUserId_unique` UNIQUE(`referredUserId`)
);
