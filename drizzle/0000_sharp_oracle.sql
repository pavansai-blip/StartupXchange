CREATE TABLE `offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`buyerId` int NOT NULL,
	`offerPrice` varchar(80) NOT NULL,
	`paymentStructure` varchar(80) NOT NULL,
	`message` text NOT NULL,
	`status` enum('SUBMITTED','NEGOTIATING','ACCEPTED','DECLINED') NOT NULL DEFAULT 'SUBMITTED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int,
	`name` varchar(160) NOT NULL,
	`startup` varchar(160) NOT NULL,
	`category` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`tech` text NOT NULL,
	`status` varchar(64) NOT NULL DEFAULT 'OPEN FOR ACQUISITION',
	`revenue` varchar(80) NOT NULL,
	`users` varchar(80) NOT NULL,
	`price` varchar(80) NOT NULL,
	`acquisitionType` varchar(100) NOT NULL,
	`color` varchar(24) NOT NULL DEFAULT 'blue',
	`logo` varchar(8) NOT NULL,
	`isDemo` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedProjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `savedProjects_user_project_unique` UNIQUE(`userId`,`projectId`)
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
