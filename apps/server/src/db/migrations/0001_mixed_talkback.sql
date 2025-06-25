CREATE TABLE `pokemon` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`height` int NOT NULL,
	`weight` int NOT NULL,
	`base_experience` int,
	`order` int,
	`is_default` int DEFAULT 1,
	`sprites` json,
	`stats` json,
	`abilities` json,
	`types` json,
	`moves` json,
	`species_url` text,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `pokemon_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pokemon_type` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`url` text,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `pokemon_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `pokemon_type_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE INDEX `name_idx` ON `pokemon` (`name`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `pokemon` (`order`);