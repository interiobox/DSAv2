import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const chatChannelsTable = pgTable("chat_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull(),
  authorId: integer("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChatChannelSchema = createInsertSchema(chatChannelsTable).omit({
  id: true,
  createdAt: true,
});
export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;
export type ChatChannel = typeof chatChannelsTable.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;