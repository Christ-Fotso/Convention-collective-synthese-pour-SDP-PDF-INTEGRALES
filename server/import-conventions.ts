import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from "@db";
import { conventions } from "@db/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importConventions() {
  try {
    const filePath = path.join(__dirname, '..', 'attached_assets', 'Pasted-IDCC-LIBELLE-16-Transports-de-fonds-et-de-valeurs-https-www-elnet-rh-fr-documentation-hulkStatic-1738176105520.txt');
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    const lines = fileContent.split('\n').slice(1); // Skip header line

    // Track IDs to handle duplicates
    const idCounts: { [key: string]: number } = {};

    const conventionsData = lines
      .filter(line => line.trim())
      .map(line => {
        const [id, name, url] = line.split('\t').map(s => s.trim());

        // If this ID has been seen before, append a suffix
        idCounts[id] = (idCounts[id] || 0) + 1;
        const uniqueId = idCounts[id] > 1 ? `${id}-${idCounts[id]}` : id;

        return { id: uniqueId, name, url };
      })
      .filter(conv => conv.id && conv.name && conv.url);

    // Delete existing conventions first to avoid duplicates
    await db.delete(conventions);

    // Insert conventions in batches
    await db.insert(conventions).values(conventionsData);
    console.log(`Successfully imported ${conventionsData.length} conventions`);
  } catch (error) {
    console.error('Error importing conventions:', error);
    process.exit(1);
  }
}

importConventions();