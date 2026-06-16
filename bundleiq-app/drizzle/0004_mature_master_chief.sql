ALTER TABLE `pack_builder_requests` ADD `customer_name` varchar(255);--> statement-breakpoint
ALTER TABLE `pack_builder_requests` ADD `customer_type` varchar(50) DEFAULT 'guest';