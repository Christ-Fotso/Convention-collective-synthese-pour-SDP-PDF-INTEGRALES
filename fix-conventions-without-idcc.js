import fs from 'fs';

// Lire le fichier data.json
const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

// Compter le nombre de conventions sans IDCC
let conventionsWithoutIdcc = 0;
let conventionsFixed = 0;

// Parcourir toutes les conventions
for (const [conventionName, conventionData] of Object.entries(data)) {
  // Vérifier si la convention n'a pas d'IDCC
  if (conventionData.idcc === "") {
    conventionsWithoutIdcc++;
    
    // Créer un identifiant unique basé sur le nom de la convention
    // Prendre les premières lettres et ajouter un numéro unique
    const cleanName = conventionName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
      .replace(/[^a-zA-Z0-9]/g, "_")   // Remplacer les caractères spéciaux par des underscores
      .toUpperCase()                    // Convertir en majuscules
      .substring(0, 20);                // Limiter à 20 caractères
    
    const newIdcc = `${cleanName}_${conventionsWithoutIdcc}`;
    
    // Assigner le nouvel identifiant
    conventionData.idcc = newIdcc;
    conventionsFixed++;
    
    console.log(`Convention "${conventionName}" : nouvel IDCC = "${newIdcc}"`);
  }
}

// Sauvegarder le fichier modifié
fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));

console.log(`\nStatistiques :`);
console.log(`- Nombre total de conventions sans IDCC : ${conventionsWithoutIdcc}`);
console.log(`- Nombre de conventions corrigées : ${conventionsFixed}`);
console.log(`\nLe fichier data.json a été mis à jour avec succès !`);