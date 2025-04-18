import { db } from "../db";
import { chatpdfSources } from "../db/schema";
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resetChatPDFSources() {
  try {
    // Delete all existing sources
    await db.delete(chatpdfSources);
    console.log('Deleted all existing ChatPDF sources');
    
    // Create an empty sources file
    const emptySources: any[] = [];
    const filePath = path.join(__dirname, '..', 'data', 'chatpdf_sources.json');
    
    await fs.promises.writeFile(
      filePath, 
      JSON.stringify(emptySources, null, 2)
    );
    
    console.log('ChatPDF sources reset successfully');
  } catch (error) {
    console.error('Error resetting ChatPDF sources:', error);
  }
}

resetChatPDFSources().catch(console.error);