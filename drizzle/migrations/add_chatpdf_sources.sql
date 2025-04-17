-- Create chatpdf_sources table
CREATE TABLE IF NOT EXISTS "chatpdf_sources" (
  "id" SERIAL PRIMARY KEY,
  "convention_id" TEXT NOT NULL REFERENCES "conventions"("id"),
  "source_id" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "chatpdf_sources_convention_id_idx" ON "chatpdf_sources" ("convention_id");