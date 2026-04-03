import { pgTable, bigserial, text, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const userReports = pgTable('user_reports', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  reportedUserId: text('reported_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reporterUserId: text('reporter_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('PENDING'),
  actionTaken: text('action_taken'),
  banDuration: integer('ban_duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  idxReportedUser: index('idx_user_reports_reported_user').on(table.reportedUserId),
  idxReporterUser: index('idx_user_reports_reporter_user').on(table.reporterUserId),
  idxStatus: index('idx_user_reports_status').on(table.status),
  idxCreatedAt: index('idx_user_reports_created_at').on(table.createdAt),
  uniqueReport: uniqueIndex('idx_user_reports_unique_report')
    .on(table.reportedUserId, table.reporterUserId)
    .where(sql`${table.status} = 'PENDING'`),
}));