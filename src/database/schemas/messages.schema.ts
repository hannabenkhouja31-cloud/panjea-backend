import { pgTable, bigserial, uuid, text, timestamp, index, check, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { trips } from './trips.schema';
import { users } from './users.schema';

export const messages = pgTable('messages', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  questionData: jsonb('question_data'),
  visibleTo: text('visible_to').array(),
  readBy: text('read_by').array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idxMessagesTripCreated: index('idx_messages_trip_created').on(table.tripId, sql`${table.createdAt} DESC`),
  idxMessagesSender: index('idx_messages_sender').on(table.senderId),
  contentCheck: check('messages_content_check', sql`length(trim(${table.content})) > 0`),
}));