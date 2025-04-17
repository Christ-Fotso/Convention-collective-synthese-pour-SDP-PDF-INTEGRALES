import { pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const conventions = pgTable("conventions", {
  id: text("id").primaryKey(), // IDCC
  name: text("name").notNull(),
  url: text("url").notNull(),
});

export const chatpdfSources = pgTable("chatpdf_sources", {
  id: serial("id").primaryKey(),
  conventionId: text("convention_id").notNull().references(() => conventions.id),
  sourceId: text("source_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConventionSchema = createInsertSchema(conventions);
export const selectConventionSchema = createSelectSchema(conventions);
export type InsertConvention = typeof conventions.$inferInsert;
export type SelectConvention = typeof conventions.$inferSelect;

export const insertChatpdfSourceSchema = createInsertSchema(chatpdfSources);
export const selectChatpdfSourceSchema = createSelectSchema(chatpdfSources);
export type InsertChatpdfSource = typeof chatpdfSources.$inferInsert;
export type SelectChatpdfSource = typeof chatpdfSources.$inferSelect;
