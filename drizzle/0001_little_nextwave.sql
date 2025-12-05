CREATE TABLE `campaignResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`brandAnalysis` text,
	`contentAssets` text,
	`visualAssets` text,
	`campaignPlan` text,
	`performanceMetrics` text,
	`optimizationFeedback` text,
	`executionTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`campaignBrief` text NOT NULL,
	`budget` int NOT NULL,
	`targetPlatforms` text NOT NULL,
	`targetKpis` text,
	`websiteUrl` varchar(512),
	`status` enum('pending','analyzing','generating','executing','completed','failed') NOT NULL DEFAULT 'pending',
	`workflowId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `campaignResults` ADD CONSTRAINT `campaignResults_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;