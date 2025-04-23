import { db } from "@db";
import { conventions } from "@db/schema";
import { eq } from 'drizzle-orm';

/**
 * Cette fonction corrige les URLs mal formatées dans la base de données
 * en s'assurant qu'elles commencent toutes par "https://"
 */
async function fixConventionUrls() {
  try {
    // Récupérer toutes les conventions de la base de données
    const allConventions = await db.select().from(conventions);
    console.log(`${allConventions.length} conventions trouvées dans la base de données`);
    
    let fixedCount = 0;
    
    // Parcourir chaque convention et vérifier/corriger son URL
    for (const convention of allConventions) {
      let originalUrl = convention.url;
      let fixedUrl = originalUrl;
      
      // Éliminer les espaces au début et à la fin
      fixedUrl = fixedUrl.trim();
      
      // Éliminer les virgules erronées
      fixedUrl = fixedUrl.replace(/^\s*,\s*/, '');
      
      // Ajouter "https://" si manquant
      if (!fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
        fixedUrl = 'https://' + fixedUrl;
      }
      
      // Mettre à jour la base de données si l'URL a été modifiée
      if (fixedUrl !== originalUrl) {
        await db.update(conventions)
          .set({ url: fixedUrl })
          .where(eq(conventions.id, convention.id));
          
        console.log(`Convention ${convention.id} (${convention.name}) URL corrigée:`);
        console.log(`  Avant: "${originalUrl}"`);
        console.log(`  Après: "${fixedUrl}"`);
        
        fixedCount++;
      }
    }
    
    console.log(`Correction terminée: ${fixedCount} URLs de conventions corrigées`);
    
  } catch (error) {
    console.error('Erreur lors de la correction des URLs:', error);
  }
}

// Exécution de la fonction
fixConventionUrls().then(() => {
  console.log('Correction des URLs terminée');
  process.exit(0);
}).catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});