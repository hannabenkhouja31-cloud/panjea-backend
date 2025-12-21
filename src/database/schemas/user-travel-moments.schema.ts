import { pgTable, text, integer, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { travelMoments } from './travel-moments.schema';

export const userTravelMoments = pgTable('user_travel_moments', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  momentId: integer('moment_id').notNull().references(() => travelMoments.id, { onDelete: 'restrict' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.momentId] }),
  idxUserTravelMomentsUser: index('idx_user_travel_moments_user').on(table.userId),
  idxUserTravelMomentsMoment: index('idx_user_travel_moments_moment').on(table.momentId),
}));