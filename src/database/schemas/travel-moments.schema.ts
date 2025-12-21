import { pgTable, serial, varchar, text, index } from 'drizzle-orm/pg-core';

export const travelMoments = pgTable('travel_moments', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  label: text('label').notNull(),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
}, (table) => ({
  idxTravelMomentsCategory: index('idx_travel_moments_category').on(table.category),
  idxTravelMomentsSlug: index('idx_travel_moments_slug').on(table.slug),
}));