import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const checklistTemplatesTable = pgTable("checklist_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const checklistTemplateItemsTable = pgTable("checklist_template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
});

export const projectChecklistsTable = pgTable("project_checklists", {
  id: serial("id").primaryKey(),
  projectName: text("project_name").notNull(),
  templateId: integer("template_id").notNull(),
  name: text("name").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectChecklistItemsTable = pgTable("project_checklist_items", {
  id: serial("id").primaryKey(),
  projectChecklistId: integer("project_checklist_id").notNull(),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedBy: integer("completed_by"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;
export type ChecklistTemplate = typeof checklistTemplatesTable.$inferSelect;
export type ChecklistTemplateItem = typeof checklistTemplateItemsTable.$inferSelect;
export type ProjectChecklist = typeof projectChecklistsTable.$inferSelect;
export type ProjectChecklistItem = typeof projectChecklistItemsTable.$inferSelect;