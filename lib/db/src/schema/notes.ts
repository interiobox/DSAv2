import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const projectNotesTable = pgTable("project_notes", {
  id: serial("id").primaryKey(),
  projectName: text("project_name").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const personalNotesTable = pgTable("personal_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  authorName: text("author_name").notNull(),
  title: text("title").notNull().default("Personal note"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectNoteSchema = createInsertSchema(projectNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProjectNote = z.infer<typeof insertProjectNoteSchema>;
export type ProjectNote = typeof projectNotesTable.$inferSelect;

export const insertPersonalNoteSchema = createInsertSchema(personalNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPersonalNote = z.infer<typeof insertPersonalNoteSchema>;
export type PersonalNote = typeof personalNotesTable.$inferSelect;