ALTER TABLE `pack_builder_requests` MODIFY COLUMN `destination` varchar(100);--> statement-breakpoint
ALTER TABLE `pack_builder_requests` MODIFY COLUMN `travel_style` varchar(100);--> statement-breakpoint
ALTER TABLE `pack_builder_requests` MODIFY COLUMN `trip_length` varchar(50);--> statement-breakpoint
ALTER TABLE `pack_builder_requests` ADD `product_count` int;--> statement-breakpoint
ALTER TABLE `pack_builder_requests` ADD `bundle_value` decimal(10,2);