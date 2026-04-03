import { pgTable, uuid, text, timestamp, primaryKey, index, bigserial, pgEnum } from 'drizzle-orm/pg-core';
import { trips } from './trips.schema';
import { users } from './users.schema';

export const tripMemberStatusEnum = pgEnum("trip_member_status", ["PENDING", "JOINED", "DECLINED", "LEFT"]);

export const tripMembers = pgTable('trip_members', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: tripMemberStatusEnum().notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.tripId, table.userId] }),
  idxTripMembersStatus: index('idx_trip_members_status').on(table.status),
  idxTripMembersTrip: index('idx_trip_members_trip').on(table.tripId),
  idxTripMembersUser: index('idx_trip_members_user').on(table.userId),
  idxTripMembersUserStatus: index('idx_trip_members_user_status').on(table.userId, table.status),
}));