CREATE TABLE `pack_builder_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`destination` varchar(100) NOT NULL,
	`travel_style` varchar(100) NOT NULL,
	`trip_length` varchar(50) NOT NULL,
	`recommended_pack` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pack_builder_requests_id` PRIMARY KEY(`id`)
);
