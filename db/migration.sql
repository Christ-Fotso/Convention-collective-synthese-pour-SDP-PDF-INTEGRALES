-- Migration pour ajouter les nouvelles tables

-- Table des sections extraites des conventions
CREATE TABLE IF NOT EXISTS "convention_sections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "convention_id" TEXT NOT NULL REFERENCES "conventions"("id") ON DELETE CASCADE,
  "section_type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'complete',
  "error_message" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "convention_section_idx" UNIQUE ("convention_id", "section_type")
);

-- Table des métriques d'utilisation API
CREATE TABLE IF NOT EXISTS "api_metrics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "api_name" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "convention_id" TEXT REFERENCES "conventions"("id") ON DELETE SET NULL,
  "tokens_in" INTEGER DEFAULT 0,
  "tokens_out" INTEGER DEFAULT 0,
  "estimated_cost" INTEGER DEFAULT 0,
  "success" BOOLEAN NOT NULL DEFAULT TRUE,
  "error_message" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table des tâches d'extraction
CREATE TABLE IF NOT EXISTS "extraction_tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "convention_id" TEXT NOT NULL REFERENCES "conventions"("id") ON DELETE CASCADE,
  "section_types" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "progress" INTEGER DEFAULT 0,
  "completed_sections" JSONB DEFAULT '[]',
  "error_sections" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ajout d'un index sur les tables
CREATE INDEX IF NOT EXISTS "convention_section_convention_id_idx" ON "convention_sections"("convention_id");
CREATE INDEX IF NOT EXISTS "api_metrics_convention_id_idx" ON "api_metrics"("convention_id");
CREATE INDEX IF NOT EXISTS "extraction_tasks_convention_id_idx" ON "extraction_tasks"("convention_id");
CREATE INDEX IF NOT EXISTS "convention_sections_section_type_idx" ON "convention_sections"("section_type");

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les timestamps automatiquement
CREATE TRIGGER update_convention_sections_updated_at
BEFORE UPDATE ON convention_sections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extraction_tasks_updated_at
BEFORE UPDATE ON extraction_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();