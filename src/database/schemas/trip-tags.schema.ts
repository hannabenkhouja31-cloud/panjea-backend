import { pgTable, uuid, smallint, primaryKey, index } from 'drizzle-orm/pg-core';
import { trips } from './trips.schema';
import { travelTypes } from './travel-types.schema';

export const tripTags = pgTable('trip_tags', {
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  travelTypeId: smallint('travel_type_id').notNull().references(() => travelTypes.id, { onDelete: 'restrict' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.tripId, table.travelTypeId] }),
  idxTripTagsTrip: index('idx_trip_tags_trip').on(table.tripId),
  idxTripTagsType: index('idx_trip_tags_type').on(table.travelTypeId),
}));