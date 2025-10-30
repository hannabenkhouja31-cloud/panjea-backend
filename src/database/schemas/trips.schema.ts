import { pgTable, uuid, text, varchar, smallint, integer, timestamp, index, check, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

const daterange = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'daterange';
  },
});

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  destinationCountry: text('destination_country').notNull(),
  summary: varchar('summary', { length: 512 }),
  monthYear: daterange('month_year').notNull(),
  minDays: smallint('min_days').notNull(),
  maxDays: smallint('max_days').notNull(),
  budgetEur: integer('budget_eur'),
  minAge: smallint('min_age'),
  maxAge: smallint('max_age'),
  organizerId: text('organizer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idxTripsBudget: index('idx_trips_budget').on(table.budgetEur),
  idxTripsCreatedAt: index('idx_trips_created_at').on(table.createdAt),
  idxTripsDestination: index('idx_trips_destination').on(table.destinationCountry),
  idxTripsMonthYearGist: index('idx_trips_month_year_gist').using('gist', table.monthYear),
  idxTripsOrganizer: index('idx_trips_organizer').on(table.organizerId),
  budgetEurCheck: check('trips_budget_eur_check', sql`${table.budgetEur} IS NULL OR ${table.budgetEur} >= 0`),
  daysCheck: check('trips_check', sql`${table.maxDays} >= ${table.minDays}`),
  maxAgeCheck: check('trips_check1', sql`${table.maxAge} IS NULL OR ${table.maxAge} >= ${table.minAge}`),
  minAgeCheck: check('trips_min_age_check', sql`${table.minAge} IS NULL OR ${table.minAge} >= 0`),
  minDaysCheck: check('trips_min_days_check', sql`${table.minDays} > 0`),
  titleCheck: check('trips_title_check', sql`length(${table.title}) >= 3 AND length(${table.title}) <= 140`),
  validRangeCheck: check('trips_valid_range', sql`lower(${table.monthYear}) IS NOT NULL AND upper(${table.monthYear}) IS NOT NULL`),
}));