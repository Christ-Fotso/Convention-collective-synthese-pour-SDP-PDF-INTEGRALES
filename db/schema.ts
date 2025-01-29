import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const conventions = pgTable("conventions", {
  id: text("id").primaryKey(), // IDCC
  name: text("name").notNull(),
  url: text("url").notNull(),
});

export const insertConventionSchema = createInsertSchema(conventions);
export const selectConventionSchema = createSelectSchema(conventions);
export type InsertConvention = typeof conventions.$inferInsert;
export type SelectConvention = typeof conventions.$inferSelect;
