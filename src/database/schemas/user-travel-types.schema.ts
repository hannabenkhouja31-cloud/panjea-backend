import { pgTable, text, smallint, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { travelTypes } from './travel-types.schema';

export const userTravelTypes = pgTable('user_travel_types', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  travelTypeId: smallint('travel_type_id').notNull().references(() => travelTypes.id, { onDelete: 'restrict' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.travelTypeId] }),
  idxUserTravelTypesType: index('idx_user_travel_types_type').on(table.travelTypeId),
  idxUserTravelTypesUser: index('idx_user_travel_types_user').on(table.userId),
}));