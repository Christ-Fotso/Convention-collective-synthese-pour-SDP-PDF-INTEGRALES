// Script pour exécuter la conversion des conventions en Markdown
import { exec } from 'child_process';

console.log('Démarrage de la conversion des conventions en Markdown...');
exec('npx tsx ./server/convert-conventions-to-markdown.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Erreur d'exécution: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});