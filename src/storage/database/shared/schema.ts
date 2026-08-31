import { pgTable, serial, timestamp, varchar, text, integer, jsonb, boolean, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const categories = pgTable(
	"categories",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		sort_order: integer("sort_order").notNull().default(0),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("categories_sort_order_idx").on(table.sort_order),
	]
);

export const products = pgTable(
	"products",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 200 }).notNull(),
		image_url: text("image_url").notNull(),
		params: jsonb("params"),
		description: text("description"),
		sort_order: integer("sort_order").notNull().default(0),
		category_id: integer("category_id").references(() => categories.id),
		is_pinned: boolean("is_pinned").notNull().default(false),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("products_sort_order_idx").on(table.sort_order),
		index("products_category_id_idx").on(table.category_id),
		index("products_is_pinned_idx").on(table.is_pinned),
	]
);
