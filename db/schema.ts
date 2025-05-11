import { pgTable, text, timestamp, serial, uuid, integer, boolean, unique, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// Table des conventions collectives
export const conventions = pgTable("conventions", {
  id: text("id").primaryKey(), // IDCC
  name: text("name").notNull(),
  url: text("url").notNull(),
});

// Table des sources ChatPDF
export const chatpdfSources = pgTable("chatpdf_sources", {
  id: serial("id").primaryKey(),
  conventionId: text("convention_id").notNull().references(() => conventions.id),
  sourceId: text("source_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table des sections extraites des conventions
export const conventionSections = pgTable("convention_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  conventionId: text("convention_id").notNull().references(() => conventions.id),
  sectionType: text("section_type").notNull(), // 'classification', 'salaires', etc.
  content: text("content").notNull(), // Contenu markdown ou JSON
  sourceUrl: text("source_url"), // URL source d'origine (ElNet)
  status: text("status").notNull().default('complete'), // 'pending', 'complete', 'error'
  errorMessage: text("error_message"), // Message d'erreur si applicable
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    conventionSectionIdx: unique().on(table.conventionId, table.sectionType),
  };
});

// Table des métriques d'utilisation API
export const apiMetrics = pgTable("api_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  apiName: text("api_name").notNull(), // 'openai', etc.
  endpoint: text("endpoint").notNull(), // Endpoint spécifique
  conventionId: text("convention_id").references(() => conventions.id), // Optionnel
  tokensIn: integer("tokens_in").default(0), // Tokens en entrée
  tokensOut: integer("tokens_out").default(0), // Tokens en sortie
  estimatedCost: integer("estimated_cost").default(0), // Coût en centimes
  success: boolean("success").notNull().default(true), // Si la requête a réussi
  errorMessage: text("error_message"), // Message d'erreur si applicable
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table des tâches d'extraction
export const extractionTasks = pgTable("extraction_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  conventionId: text("convention_id").notNull().references(() => conventions.id),
  sectionTypes: json("section_types").$type<string[]>().notNull(), // Array des types de sections à extraire
  status: text("status").notNull().default('pending'), // 'pending', 'processing', 'complete', 'error'
  progress: integer("progress").default(0), // Progression de 0 à 100
  completedSections: json("completed_sections").$type<string[]>().default([]),
  errorSections: json("error_sections").$type<{section: string, error: string}[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schémas d'insertion et de sélection
export const insertConventionSchema = createInsertSchema(conventions);
export const selectConventionSchema = createSelectSchema(conventions);
export type InsertConvention = typeof conventions.$inferInsert;
export type SelectConvention = typeof conventions.$inferSelect;

export const insertChatpdfSourceSchema = createInsertSchema(chatpdfSources);
export const selectChatpdfSourceSchema = createSelectSchema(chatpdfSources);
export type InsertChatpdfSource = typeof chatpdfSources.$inferInsert;
export type SelectChatpdfSource = typeof chatpdfSources.$inferSelect;

export const insertConventionSectionSchema = createInsertSchema(conventionSections);
export const selectConventionSectionSchema = createSelectSchema(conventionSections);
export type InsertConventionSection = typeof conventionSections.$inferInsert;
export type SelectConventionSection = typeof conventionSections.$inferSelect;

export const insertApiMetricSchema = createInsertSchema(apiMetrics);
export const selectApiMetricSchema = createSelectSchema(apiMetrics);
export type InsertApiMetric = typeof apiMetrics.$inferInsert;
export type SelectApiMetric = typeof apiMetrics.$inferSelect;

export const insertExtractionTaskSchema = createInsertSchema(extractionTasks);
export const selectExtractionTaskSchema = createSelectSchema(extractionTasks);
export type InsertExtractionTask = typeof extractionTasks.$inferInsert;
export type SelectExtractionTask = typeof extractionTasks.$inferSelect;
