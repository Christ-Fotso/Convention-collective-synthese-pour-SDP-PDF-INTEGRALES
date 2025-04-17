# Instructions pour mettre à jour les données

Ce dossier contient les fichiers JSON qui permettent de mettre à jour les données de l'application.

## Fichiers disponibles

1. **conventions.json** - Liste des Conventions Collectives Nationales (CCN)
   - Structure: liste d'objets avec `id`, `name` et `url`
   - L'`id` est le numéro IDCC formaté sur 4 chiffres (ex: "0018")
   - L'`url` est le lien vers le PDF de la convention

2. **chatpdf_sources.json** - Liens entre conventions et sources ChatPDF
   - Structure: liste d'objets avec `conventionId` et `sourceId`
   - Le `conventionId` correspond à l'`id` dans conventions.json
   - Le `sourceId` est l'identifiant unique de ChatPDF

3. **categories.json** - Catégories et sous-catégories 
   - Structure: liste d'objets avec `id`, `name` et un tableau `subcategories`
   - Chaque sous-catégorie a un `id` et un `name`

4. **prompts.json** - Prompts prédéfinis par catégorie et sous-catégorie
   - Structure: objet avec catégorie comme clé
   - Chaque catégorie contient un objet avec sous-catégorie comme clé
   - La valeur est le prompt sous forme de texte

## Comment mettre à jour

1. Modifiez directement les fichiers JSON
2. Assurez-vous que le format JSON est valide (pas de virgules en trop, etc.)
3. Utilisez le script d'importation pour charger les données dans la base de données

## Exemple d'utilisation

Pour mettre à jour les conventions et leurs sources ChatPDF:
1. Modifiez `conventions.json` avec la liste complète des conventions
2. Modifiez `chatpdf_sources.json` avec les nouvelles sources
3. Exécutez le script d'importation