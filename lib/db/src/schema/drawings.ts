import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  deletedAt: true,
  createdAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;

export const drawingsTable = pgTable("drawings", {
  id: serial("id").primaryKey(),
  drawingNumber: text("drawing_number").notNull(),
  title: text("title").notNull(),
  discipline: text("discipline").notNull(),
  status: text("status").notNull().default("draft"),
  assignedTo: text("assigned_to"),
  assignedToUserId: integer("assigned_to_user_id"),
  revision: text("revision").notNull().default("A"),
  projectName: text("project_name").notNull(),
  sheetSize: text("sheet_size").notNull().default("A1"),
  author: text("author").notNull(),
  description: text("description"),
  dueDate: date("due_date", { mode: "string" }),
  issuedDate: date("issued_date", { mode: "string" }),
  attachmentPath: text("attachment_path"),
  attachmentName: text("attachment_name"),
  attachmentSize: integer("attachment_size"),
  attachmentContentType: text("attachment_content_type"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDrawingSchema = createInsertSchema(drawingsTable).omit({
  id: true,
  deletedAt: true,
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
  actor: text("actor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const drawingUploadsTable = pgTable("drawing_uploads", {
  id: serial("id").primaryKey(),
  drawingId: integer("drawing_id").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDrawingUploadSchema = createInsertSchema(drawingUploadsTable).omit({
  id: true,
  deletedAt: true,
  uploadedAt: true,
});
export type InsertDrawingUpload = z.infer<typeof insertDrawingUploadSchema>;
export type DrawingUpload = typeof drawingUploadsTable.$inferSelect;

export const drawingCommentsTable = pgTable("drawing_comments", {
  id: serial("id").primaryKey(),
  drawingId: integer("drawing_id").notNull(),
  comment: text("comment").notNull(),
  author: text("author").notNull(),
  authorId: integer("author_id"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDrawingCommentSchema = createInsertSchema(drawingCommentsTable).omit({
  id: true,
  deletedAt: true,
  createdAt: true,
});
export type InsertDrawingComment = z.infer<typeof insertDrawingCommentSchema>;
export type DrawingComment = typeof drawingCommentsTable.$inferSelect;

export const insertDrawingActivitySchema = createInsertSchema(drawingActivityTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDrawingActivity = z.infer<typeof insertDrawingActivitySchema>;
export type DrawingActivity = typeof drawingActivityTable.$inferSelect;