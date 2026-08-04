import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const disciplinesTable = pgTable("disciplines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDisciplineSchema = createInsertSchema(disciplinesTable).omit({
  id: true,
  deletedAt: true,
  createdAt: true,
});

export type InsertDiscipline = z.infer<typeof insertDisciplineSchema>;
export type Discipline = typeof disciplinesTable.$inferSelect;