import { pgTable, bigserial, uuid, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { trips } from './trips.schema';
import { users } from './users.schema';

export const tripQuestions = pgTable('trip_questions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idxTripQuestionsAuthor: index('idx_trip_questions_author').on(table.authorId),
  idxTripQuestionsTripCreated: index('idx_trip_questions_trip_created').on(table.tripId, table.createdAt),
  messageCheck: check('trip_questions_message_check', sql`length(${table.message}) > 0`),
}));