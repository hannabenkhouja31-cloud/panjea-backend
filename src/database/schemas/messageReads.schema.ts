import { pgTable, bigserial, uuid, text, timestamp, index, check, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { messages } from './messages.schema';

export const messageReads = pgTable('message_reads', {
  messageId: bigserial('message_id', { mode: 'bigint' }).notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.messageId, table.userId] }),
  idxMessageReadsMessage: index('idx_message_reads_message').on(table.messageId),
  idxMessageReadsUser: index('idx_message_reads_user').on(table.userId),
}));