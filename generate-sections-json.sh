#!/bin/bash

# Script pour générer un fichier JSON à partir d'un répertoire de sections

if [ "$1" == "" ] || [ "$2" == "" ]; then
  echo "Usage: ./generate-sections-json.sh <répertoire-des-sections> <fichier-json-output>"
  exit 1
fi

echo "Génération du fichier JSON à partir de $1..."
npx tsx generate-sections-json.ts $1 $2