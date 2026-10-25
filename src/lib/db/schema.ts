import { pgTable, text, timestamp, integer, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  category: text('category').notNull().default('General'),
  answerType: text('answer_type').notNull().default('yes_no'),
  active: boolean('active').notNull().default(true),
  order: integer('order').notNull().default(0),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questionOptions = pgTable('question_options', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  outcome: text('outcome').notNull().default('neutral'), // 'positive' | 'negative' | 'neutral'
  explanation: text('explanation'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const hourlyEntries = pgTable(
  'hourly_entries',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    optionId: text('option_id').references(() => questionOptions.id, { onDelete: 'set null' }),
    value: text('value').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    timeSlot: text('time_slot').notNull(), // HH:MM
    outcomeSnapshot: text('outcome_snapshot').notNull(), // 'positive' | 'negative' | 'neutral'
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_question_slot_unique').on(table.userId, table.questionId, table.date, table.timeSlot),
  ]
);

export const userSettings = pgTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  trackingStartHour: integer('tracking_start_hour').notNull().default(6),
  trackingEndHour: integer('tracking_end_hour').notNull().default(21),
  trackingIntervalMinutes: integer('tracking_interval_minutes').notNull().default(60),
  timezone: text('timezone').notNull().default('UTC'),
  theme: text('theme').notNull().default('dark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(false),
  mode: text('mode').notNull().default('interval'), // 'interval' | 'specific_times'
  intervalMinutes: integer('interval_minutes').notNull().default(60),
  specificTimes: text('specific_times').notNull().default('["09:00","13:00","17:00","21:00"]'),
  quietHoursStart: text('quiet_hours_start').notNull().default('22:00'),
  quietHoursEnd: text('quiet_hours_end').notNull().default('06:00'),
  daysOfWeek: text('days_of_week').notNull().default('[1,2,3,4,5,6,0]'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});


export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  questions: many(questions),
  entries: many(hourlyEntries),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  user: one(users, {
    fields: [questions.userId],
    references: [users.id],
  }),
  options: many(questionOptions),
  entries: many(hourlyEntries),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one, many }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
  entries: many(hourlyEntries),
}));

export const hourlyEntriesRelations = relations(hourlyEntries, ({ one }) => ({
  user: one(users, {
    fields: [hourlyEntries.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [hourlyEntries.questionId],
    references: [questions.id],
  }),
  option: one(questionOptions, {
    fields: [hourlyEntries.optionId],
    references: [questionOptions.id],
  }),
}));
