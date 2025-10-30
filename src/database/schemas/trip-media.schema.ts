import { pgTable, bigserial, uuid, text, smallint, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { trips } from './trips.schema';

export const tripMedia = pgTable('trip_media', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: smallint('position').notNull().default(1),
}, (table) => ({
  idxTripMediaTripPos: index('idx_trip_media_trip_pos').on(table.tripId, table.position),
  positionCheck: check('trip_media_position_check', sql`${table.position} > 0`),
  urlCheck: check('trip_media_url_check', sql`${table.url} ~* '^https?://'::text`),
}));