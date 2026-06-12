import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  decimal,
} from "drizzle-orm/mysql-core";

export const bundles = mysqlTable("bundles", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  bundleType: varchar("bundle_type", {
    length: 50,
  }),

  score: int("score").default(0),

  rankPosition: int("rank_position"),

  status: varchar("status", {
    length: 50,
  }).default("draft"),

  createdAt: timestamp("created_at")
    .defaultNow(),

  updatedAt: timestamp("updated_at")
    .defaultNow(),
});

export const bundleProducts = mysqlTable("bundle_products", {
    id: int("id").autoincrement().primaryKey(),

    bundleId: int("bundle_id").notNull(),

    productHandle: varchar(
      "product_handle",
      { length: 255 }
    ).notNull(),

    productTitle: varchar(
      "product_title",
      { length: 255 }
    ).notNull(),

    productPrice: decimal(
      "product_price",
      {
        precision: 10,
        scale: 2,
      }
    ).notNull(),

    productType: varchar(
      "product_type",
      { length: 100 }
    ),
  }
);

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),

    bundleId: int("bundle_id").notNull(),

    action: varchar("action", {
      length: 100,
    }).notNull(),

    details: text("details"),

    createdAt: timestamp("created_at")
      .defaultNow(),
  }
);
