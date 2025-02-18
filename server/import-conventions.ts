import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from "@db";
import { conventions } from "@db/schema";
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importConventions() {
  try {
    const filePath = path.join(__dirname, '..', 'attached_assets', 'Pasted-IDCC-LIBELLE-16-Transports-de-fonds-et-de-valeurs-https-www-elnet-rh-fr-documentation-hulkStatic-1739915869443.txt');
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    const lines = fileContent.split('\n').slice(1); // Skip header line

    // Track IDs to handle duplicates
    const idCounts: { [key: string]: number } = {};

    const conventionsData = lines
      .filter(line => line.trim())
      .map(line => {
        const [id, name, url] = line.split('\t').map(s => s.trim());

        // Format IDCC to 4 digits
        const formattedId = id.padStart(4, '0');

        // If this ID has been seen before, append a suffix
        idCounts[formattedId] = (idCounts[formattedId] || 0) + 1;
        const uniqueId = idCounts[formattedId] > 1 ? `${formattedId}-${idCounts[formattedId]}` : formattedId;

        return { id: uniqueId, name, url };
      })
      .filter(conv => conv.id && conv.name && conv.url);

    // First, delete all cached responses
    await db.execute(sql`DELETE FROM cached_responses`);
    console.log('Deleted all cached responses');

    // Then delete existing conventions
    await db.delete(conventions);
    console.log('Deleted existing conventions');

    // Insert conventions in batches
    await db.insert(conventions).values(conventionsData);
    console.log(`Successfully imported ${conventionsData.length} conventions`);
  } catch (error) {
    console.error('Error importing conventions:', error);
    process.exit(1);
  }
}

importConventions();