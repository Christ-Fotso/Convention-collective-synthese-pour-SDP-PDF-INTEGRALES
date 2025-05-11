#!/bin/bash

# Script pour importer des sections depuis un fichier JSON

if [ "$1" == "" ]; then
  echo "Usage: ./import-sections.sh <fichier-json>"
  exit 1
fi

echo "Importation des sections depuis $1..."
npx tsx import-sections.ts $1