import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from "@db";
import { conventions, chatpdfSources } from "@db/schema";
import { sql } from 'drizzle-orm';
import { CATEGORIES } from '../client/src/lib/categories';
import { PREDEFINED_PROMPTS } from '../client/src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to import conventions from JSON file
async function importConventionsFromJson() {
  try {
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

    // First, delete all cached responses if the table exists
    try {
      await db.execute(sql`DELETE FROM cached_responses`);
      console.log('Deleted all cached responses');
    } catch (error) {
      console.log('No cached_responses table found, skipping deletion');
    }

    // Then delete existing conventions
    await db.delete(conventions);
    console.log('Deleted existing conventions');

    // Insert conventions
    await db.insert(conventions).values(conventionsData);
    console.log(`Successfully imported ${conventionsData.length} conventions`);
  } catch (error) {
    console.error('Error importing conventions from JSON:', error);
  }
}

// Function to import ChatPDF sources from JSON file
async function importChatPdfSourcesFromJson() {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'chatpdf_sources.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('ChatPDF sources JSON file not found');
      return;
    }
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const sourcesData = JSON.parse(fileContent);

    if (!Array.isArray(sourcesData)) {
      console.error('Invalid ChatPDF sources JSON format, expected an array');
      return;
    }

    // Delete existing sources
    await db.delete(chatpdfSources);
    console.log('Deleted existing ChatPDF sources');

    // Insert sources
    const sources = sourcesData.map((source, index) => ({
      id: index + 1, // Auto-increment ID
      conventionId: source.conventionId,
      sourceId: source.sourceId,
      createdAt: new Date()
    }));

    await db.insert(chatpdfSources).values(sources);
    console.log(`Successfully imported ${sources.length} ChatPDF sources`);
  } catch (error) {
    console.error('Error importing ChatPDF sources from JSON:', error);
  }
}

// Function to update categories file
async function updateCategoriesFile() {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'categories.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('Categories JSON file not found');
      return;
    }
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const categoriesData = JSON.parse(fileContent);

    if (!Array.isArray(categoriesData)) {
      console.error('Invalid categories JSON format, expected an array');
      return;
    }

    // Write to categories.ts file
    const targetFilePath = path.join(__dirname, '..', 'client', 'src', 'lib', 'categories.ts');
    const fileContent2 = `import { type Category } from '@/types';

export const CATEGORIES: Category[] = ${JSON.stringify(categoriesData, null, 2)};
`;

    await fs.promises.writeFile(targetFilePath, fileContent2);
    console.log('Successfully updated categories file');
  } catch (error) {
    console.error('Error updating categories file:', error);
  }
}

// Function to update prompts file
async function updatePromptsFile() {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'prompts.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('Prompts JSON file not found');
      return;
    }
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const promptsData = JSON.parse(fileContent);

    // Validate structure
    if (typeof promptsData !== 'object' || promptsData === null) {
      console.error('Invalid prompts JSON format, expected an object');
      return;
    }

    // Update the PREDEFINED_PROMPTS in types/index.ts
    const targetFilePath = path.join(__dirname, '..', 'client', 'src', 'types', 'index.ts');
    let typesFileContent = await fs.promises.readFile(targetFilePath, 'utf-8');
    
    // Find where PREDEFINED_PROMPTS starts and ends
    const promptsStartRegex = /export const PREDEFINED_PROMPTS: Record<string, Record<string, string>> = \{/;
    const promptsStartMatch = typesFileContent.match(promptsStartRegex);
    
    if (!promptsStartMatch) {
      console.error('Could not find PREDEFINED_PROMPTS in types/index.ts');
      return;
    }
    
    // Find the end of the PREDEFINED_PROMPTS object (last closing brace)
    let braceCount = 0;
    let endIndex = -1;
    
    for (let i = promptsStartMatch.index!; i < typesFileContent.length; i++) {
      const char = typesFileContent[i];
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    if (endIndex === -1) {
      console.error('Could not find end of PREDEFINED_PROMPTS in types/index.ts');
      return;
    }
    
    // Replace the PREDEFINED_PROMPTS object with the new one
    const newPromptsContent = `export const PREDEFINED_PROMPTS: Record<string, Record<string, string>> = ${JSON.stringify(promptsData, null, 2)};`;
    
    typesFileContent = 
      typesFileContent.slice(0, promptsStartMatch.index) + 
      newPromptsContent +
      typesFileContent.slice(endIndex);
    
    await fs.promises.writeFile(targetFilePath, typesFileContent);
    console.log('Successfully updated prompts file');
  } catch (error) {
    console.error('Error updating prompts file:', error);
  }
}

// Main function to run all imports
async function importAllData() {
  // First update file-based data
  await updateCategoriesFile();
  await updatePromptsFile();
  
  // Then update database data
  await importConventionsFromJson();
  await importChatPdfSourcesFromJson();
  
  console.log('All data imported successfully');
}

// Run the import
importAllData().catch(console.error);