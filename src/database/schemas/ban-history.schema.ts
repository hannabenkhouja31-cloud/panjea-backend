import { pgTable, bigserial, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const banHistory = pgTable('ban_history', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  adminId: text('admin_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  reason: text('reason'),
  duration: integer('duration'),
  bannedUntil: timestamp('banned_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idxUserId: index('idx_ban_history_user_id').on(table.userId),
  idxAdminId: index('idx_ban_history_admin_id').on(table.adminId),
  idxCreatedAt: index('idx_ban_history_created_at').on(table.createdAt),
}));