/**
 * Script pour corriger spécifiquement la section "Événement familial" de la convention 901
 */

import { readFileSync, writeFileSync } from 'fs';

// Le contenu original de la section (format liste)
const originalContent = `## Congés pour Événements Familiaux

* **Déménagement:**
    * Durée conv.: 1 jour
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.
* **Naissance / Adoption:**
    * Durée conv.: Congés prévus par les articles L. 3142-1 2° du Code du travail.
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.
* **Mariage / PACS:**
    * Durée conv.: 5 jours
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.
* **Mariage d'un enfant:**
    * Durée conv.: 2 jours
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.
* **Mariage d'un frère ou d'une sœur:**
    * Durée conv.: 1 jour
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.
* **Décès d'un ascendant ou descendant en ligne directe:**
    * Durée conv.: 2 jours
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.
* **Décès du conjoint ou partenaire de PACS:**
    * Durée conv.: 5 jours
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.
* **Décès du beau-père, de la belle-mère, d'un frère, d'une sœur:**
    * Durée conv.: 1 jour
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.
* **Présélection militaire:**
    * Durée conv.: 3 jours maximum.
    * Conditions spéc.: La convention ne prévoit rien à ce sujet.

**Jours Supplémentaires:** Un jour supplémentaire est accordé sur justification du déplacement pour la présélection militaire.

**Conditions Générales (pour tous les événements listés ci-dessus sauf Naissance/Adoption):**

* Les congés peuvent être pris dans les quinze jours entourant l'événement.
* L'employeur doit être prévenu, sauf cas de force majeure, quinze jours à l'avance.
* Les congés sont rémunérés.
* Ils ne sont pas déduits des congés annuels.`;

// Le nouveau contenu en format tableau
const tableContent = `## Congés pour Événements Familiaux

| **Événement** | **Durée conventionnelle** | **Conditions spécifiques** |
|---------------|---------------------------|----------------------------|
| **Déménagement** | 1 jour | La convention ne prévoit rien à ce sujet. |
| **Naissance / Adoption** | Congés prévus par les articles L. 3142-1 2° du Code du travail | La convention ne prévoit rien à ce sujet. |
| **Mariage / PACS** | 5 jours | La convention ne prévoit rien à ce sujet. |
| **Mariage d'un enfant** | 2 jours | La convention ne prévoit rien à ce sujet. |
| **Mariage d'un frère ou d'une sœur** | 1 jour | La convention ne prévoit rien à ce sujet. |
| **Décès d'un ascendant ou descendant en ligne directe** | 2 jours | La convention ne prévoit rien à ce sujet. |
| **Décès du conjoint ou partenaire de PACS** | 5 jours | La convention ne prévoit rien à ce sujet. |
| **Décès du beau-père, de la belle-mère, d'un frère, d'une sœur** | 1 jour | La convention ne prévoit rien à ce sujet. |
| **Présélection militaire** | 3 jours maximum | Un jour supplémentaire est accordé sur justification du déplacement |

### Conditions Générales

**Applicables à tous les événements listés ci-dessus (sauf Naissance/Adoption) :**

- Les congés peuvent être pris dans les quinze jours entourant l'événement
- L'employeur doit être prévenu, sauf cas de force majeure, quinze jours à l'avance  
- Les congés sont rémunérés
- Ils ne sont pas déduits des congés annuels`;

function fixEventFamilial901() {
  console.log('🔧 Correction de la section Événement familial pour la convention 901...');
  
  try {
    // Charger le fichier data.json
    const jsonContent = readFileSync('./data.json', 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    
    // Trouver la convention 901
    for (const [conventionName, conventionData] of Object.entries(jsonData)) {
      if (conventionData && typeof conventionData === 'object' && 
          'idcc' in conventionData && conventionData.idcc === '901') {
        
        // Mettre à jour la section Événement familial
        if (conventionData.sections && conventionData.sections['Evènement_familial']) {
          conventionData.sections['Evènement_familial'].contenu = tableContent;
          console.log(`✅ Section Événement familial mise à jour pour la convention 901`);
          
          // Sauvegarder le fichier
          writeFileSync('./data.json', JSON.stringify(jsonData, null, 2));
          console.log('🎉 Fichier data.json mis à jour avec succès !');
          return;
        }
      }
    }
    
    console.log('❌ Convention 901 ou section Événement familial non trouvée');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

fixEventFamilial901();