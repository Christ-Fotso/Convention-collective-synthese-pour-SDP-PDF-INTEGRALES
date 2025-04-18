import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from "../db";
import { conventions, chatpdfSources } from "../db/schema";
import { InsertConvention } from "../db/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateConventionLinks() {
  try {
    console.log('Starting migration of convention links...');

    // 1. Read the current conventions file
    const filePath = path.join(__dirname, '..', 'data', 'conventions.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('Conventions JSON file not found');
      return;
    }
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const conventionsData = JSON.parse(fileContent);

    // 2. Keep only the conventions with the new link format (CCOL format) and valid IDs
    let filteredConventions = conventionsData.filter((conv: any) => {
      // Check if the URL follows the new format and has a valid ID
      return conv.url && 
             conv.url.includes('/CCOL/') && 
             conv.id && 
             conv.id.trim() !== '';
    });

    // 3. Remove duplicates based on ID (keep the first occurrence)
    const idMap = new Map();
    const newConventions = filteredConventions.filter((conv: any) => {
      if (idMap.has(conv.id)) {
        console.log(`Found duplicate convention ID: ${conv.id}, skipping...`);
        return false;
      }
      idMap.set(conv.id, true);
      return true;
    });

    console.log(`Found ${newConventions.length} conventions with new link format and valid IDs out of ${conventionsData.length} total`);

    // 3. Delete all existing ChatPDF sources since they point to old URLs
    try {
      await db.delete(chatpdfSources);
      console.log('Deleted all existing ChatPDF sources');
    } catch (error) {
      console.error('Error deleting chatpdf sources:', error);
    }

    // 4. Update the conventions file with only the new format links
    await fs.promises.writeFile(
      filePath, 
      JSON.stringify(newConventions, null, 2)
    );
    
    // 5. Reset the chatpdf_sources.json file to an empty array
    const sourcesPath = path.join(__dirname, '..', 'data', 'chatpdf_sources.json');
    await fs.promises.writeFile(
      sourcesPath, 
      JSON.stringify([], null, 2)
    );

    // 6. Delete and reimport conventions to the database
    try {
      await db.delete(conventions);
      console.log('Deleted existing conventions');

      // Insert conventions with new links
      await db.insert(conventions).values(newConventions);
      console.log(`Successfully imported ${newConventions.length} conventions with new link format`);
    } catch (error) {
      console.error('Error updating conventions in database:', error);
    }

    console.log('Migration of convention links completed!');
  } catch (error) {
    console.error('Error migrating convention links:', error);
  }
}

migrateConventionLinks().catch(console.error);