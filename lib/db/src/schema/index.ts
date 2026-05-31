import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const registrantTable = sqliteTable("registrants", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["contestant", "audience"] }).notNull(),
  name: text("name").notNull(),
  matric: text("matric"),
  department: text("department").notNull(),
  level: text("level").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  passportBase64: text("passport_base64"),
  registeredAt: text("registered_at").notNull(),
});

export type Registrant = typeof registrantTable.$inferSelect;
export type NewRegistrant = typeof registrantTable.$inferInsert;

export const cohortScoreTable = sqliteTable("cohort_scores", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sprint: real("sprint").notNull().default(0),
  clash: real("clash").notNull().default(0),
  specialist: real("specialist").notNull().default(0),
  puzzle: real("puzzle").notNull().default(0),
  buzzer: real("buzzer").notNull().default(0),
  blackout: real("blackout").notNull().default(0),
});

export type CohortScore = typeof cohortScoreTable.$inferSelect;
export type NewCohortScore = typeof cohortScoreTable.$inferInsert;

export const newsTable = sqliteTable("news", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
});

export type NewsItem = typeof newsTable.$inferSelect;
export type NewNewsItem = typeof newsTable.$inferInsert;

export const adminSessionTable = sqliteTable("admin_sessions", {
  token: text("token").primaryKey(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export type AdminSession = typeof adminSessionTable.$inferSelect;
export type NewAdminSession = typeof adminSessionTable.$inferInsert;
