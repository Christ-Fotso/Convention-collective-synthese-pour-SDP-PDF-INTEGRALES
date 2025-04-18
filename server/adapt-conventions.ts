import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Adapter function to convert from the new format to the application format
async function adaptConventions() {
  try {
    // Read the current conventions.json file
    const filePath = path.join(__dirname, '..', 'data', 'conventions.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('Conventions JSON file not found');
      return;
    }
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const conventionsData = JSON.parse(fileContent);

    if (!Array.isArray(conventionsData)) {
      console.error('Invalid conventions JSON format, expected an array');
      return;
    }

    // Convert to the application format
    const adaptedConventions = conventionsData.map(convention => {
      return {
        id: convention.IDCC || "",
        name: convention["Nom De la Convention"] || "",
        url: convention.Link || ""
      };
    }).filter(convention => convention.id && convention.name && convention.url);

    // Create a backup of the original file
    const backupPath = path.join(__dirname, '..', 'data', 'conventions_original.json');
    await fs.promises.writeFile(backupPath, fileContent);
    console.log(`Original conventions file backed up to ${backupPath}`);

    // Write the adapted conventions to the original file
    await fs.promises.writeFile(
      filePath, 
      JSON.stringify(adaptedConventions, null, 2)
    );
    console.log(`Successfully adapted ${adaptedConventions.length} conventions`);

    return adaptedConventions;
  } catch (error) {
    console.error('Error adapting conventions:', error);
  }
}

// Run the adapter
adaptConventions().catch(console.error);