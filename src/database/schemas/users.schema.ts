import { pgTable, text, varchar, integer, boolean, timestamp, index, check, smallint } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { citext } from './custom-types';

export const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh', 'ar', 'hi', 'tr', 'ko'] as const;

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: citext('username').notNull().unique(),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  age: smallint('age'),
  languages: text('languages').array().notNull().default(sql`'{}'::text[]`),
  tripsCount: integer('trips_count').notNull().default(0),
  description: varchar('description', { length: 512 }),
  budgetLevel: integer('budget_level'),
  profilePictureUrl: text('profile_picture_url'),
  isVerified: boolean('is_verified').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  emailVerified: boolean('email_verified').notNull().default(false),
  isAdmin: boolean('is_admin').notNull().default(false),
  reportedCount: integer('reported_count').notNull().default(0),
  isBanned: boolean('is_banned').notNull().default(false),
  bannedAt: timestamp('banned_at', { withTimezone: true }),
  bannedReason: text('banned_reason'),
  bannedUntil: timestamp('banned_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  email: varchar('email', { length: 255 }),
  isFromBubble: boolean('is_from_bubble').default(false),
}, (table) => ({
  idxUsersCity: index('idx_users_city').on(table.city),
  idxUsersCountry: index('idx_users_country').on(table.country),
  idxUsersCreatedAt: index('idx_users_created_at').on(table.createdAt),
  idxUsersLanguagesGin: index('idx_users_languages_gin').using('gin', table.languages),
  idxUsersEmail: index('idx_users_email').on(table.email),
  budgetLevelCheck: check('users_budget_level_check', sql`${table.budgetLevel} >= 1 AND ${table.budgetLevel} <= 3`),
  tripsCountCheck: check('users_trips_count_check', sql`${table.tripsCount} >= 0`),
  usernameCheck: check('users_username_check', sql`${table.username} ~ '^[A-Za-z0-9_\.]{3,50}$'::citext`),
  languagesCheck: check('users_languages_check', sql`${table.languages} <@ ARRAY['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh', 'ar', 'hi', 'tr', 'ko']::text[]`),
  ageCheck: check('users_age_check', sql`${table.age} IS NULL OR (${table.age} >= 18 AND ${table.age} <= 120)`),
}));