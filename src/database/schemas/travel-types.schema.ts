import { pgTable, smallserial, text, check, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const travelTypes = pgTable('travel_types', {
  id: smallserial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull(),
}, (table) => ({
  slugCheck: check('travel_types_slug_check', sql`${table.slug} ~ '^[a-z0-9_]+$'::text`),
}));