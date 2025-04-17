#!/bin/bash

# Script pour importer les données JSON
echo "Démarrage de l'importation des données..."

# Exécuter le script d'importation TypeScript
npx tsx server/import-json-data.ts

echo "Importation terminée !"