import { pgTable, bigserial, uuid, text, smallint, unique, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { trips } from './trips.schema';

export const tripHighlights = pgTable('trip_highlights', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  tripId: uuid('trip_id').notNull().unique().references(() => trips.id, { onDelete: 'cascade' }),
  position: smallint('position').notNull().unique(),
  text: text('text').notNull(),
}, (table) => ({
  tripIdPositionUnique: unique().on(table.tripId, table.position),
  idxTripHighlightsTripPos: index('idx_trip_highlights_trip_pos').on(table.tripId, table.position),
  positionCheck: check('trip_highlights_position_check', sql`${table.position} > 0`),
  textCheck: check('trip_highlights_text_check', sql`length(${table.text}) >= 1 AND length(${table.text}) <= 280`),
}));