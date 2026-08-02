import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const drawingsTable = pgTable("drawings", {
  id: serial("id").primaryKey(),
  drawingNumber: text("drawing_number").notNull(),
  title: text("title").notNull(),
  discipline: text("discipline").notNull(),
  status: text("status").notNull().default("draft"),
  revision: text("revision").notNull().default("A"),
  projectName: text("project_name").notNull(),
  sheetSize: text("sheet_size").notNull().default("A1"),
  author: text("author").notNull(),
  description: text("description"),
  dueDate: date("due_date", { mode: "string" }),
  issuedDate: date("issued_date", { mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDrawingSchema = createInsertSchema(drawingsTable).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});
export type InsertDrawing = z.infer<typeof insertDrawingSchema>;
export type Drawing = typeof drawingsTable.$inferSelect;

export const drawingActivityTable = pgTable("drawing_activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  drawingId: integer("drawing_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDrawingActivitySchema = createInsertSchema(drawingActivityTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDrawingActivity = z.infer<typeof insertDrawingActivitySchema>;
export type DrawingActivity = typeof drawingActivityTable.$inferSelect;