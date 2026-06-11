CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundle_id` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`details` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bundle_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundle_id` int NOT NULL,
	`product_handle` varchar(255) NOT NULL,
	`product_title` varchar(255) NOT NULL,
	`product_price` decimal(10,2) NOT NULL,
	CONSTRAINT `bundle_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`bundle_type` varchar(50),
	`score` int DEFAULT 0,
	`rank_position` int,
	`status` varchar(50) DEFAULT 'draft',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `bundles_id` PRIMARY KEY(`id`)
);
