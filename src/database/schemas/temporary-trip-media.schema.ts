import { pgTable, bigserial, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const temporaryTripMedia = pgTable('temporary_trip_media', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idxTemporaryTripMediaUserId: index('idx_temporary_trip_media_user_id').on(table.userId),
  idxTemporaryTripMediaUploadedAt: index('idx_temporary_trip_media_uploaded_at').on(table.uploadedAt),
  urlCheck: check('temporary_trip_media_url_check', sql`${table.url} ~* '^https?://'::text`),
}));