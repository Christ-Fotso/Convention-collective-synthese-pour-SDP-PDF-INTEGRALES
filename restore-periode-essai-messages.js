import fs from 'fs';

console.log("🔧 Restauration des messages personnalisés pour les périodes d'essai...");

// Charger le fichier de données
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Messages personnalisés à ajouter
const messageApplicable = `La durée conventionnelle n'est pas applicable dans cette convention collective.

| Catégorie | Durée Initiale | Renouvellement | Durée Renouvellement |
|-----------|---------------|---------------|---------------------|
| Non mentionné | Non mentionné | Non mentionné | Non mentionné |

**Note :** En l'absence de dispositions conventionnelles spécifiques, les durées légales du Code du travail s'appliquent.`;

const messageRAS = `Aucune disposition relative à la période d'essai n'est mentionnée dans la convention collective.

| Catégorie | Durée Initiale | Renouvellement | Durée Renouvellement |
|-----------|---------------|---------------|---------------------|
| Non mentionné | Non mentionné | Non mentionné | Non mentionné |`;

let modificationsCount = 0;
let rasCount = 0;
let emptyCount = 0;

// Parcourir toutes les conventions  
for (const [convName, convData] of Object.entries(data)) {
  if (convData.sections && convData.sections["Période_d'essai"]) {
    const section = convData.sections["Période_d'essai"];
    const content = section.contenu?.trim() || '';
    
    // Cas 1: Section vide
    if (!content) {
      section.contenu = messageRAS;
      emptyCount++;
      modificationsCount++;
    }
    // Cas 2: Section avec seulement "RAS"
    else if (content === 'RAS' || content === 'RAS\n') {
      section.contenu = messageRAS;
      rasCount++;
      modificationsCount++;
    }
    // Cas 3: Contenu très court qui semble incomplet
    else if (content.length < 30 && !content.includes('|')) {
      section.contenu = messageApplicable;
      modificationsCount++;
    }
  }
}

// Sauvegarder les modifications
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

console.log(`✅ Modifications terminées :`);
console.log(`   📝 ${emptyCount} sections vides traitées`);
console.log(`   🔄 ${rasCount} sections "RAS" améliorées`);
console.log(`   📊 ${modificationsCount} modifications au total`);
console.log(`   💾 Fichier data.json mis à jour`);